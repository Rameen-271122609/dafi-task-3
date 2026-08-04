# Deploying MediTrack

End-to-end runbook: Supabase project → AWS EC2 → PM2 → Nginx → Let's Encrypt →
custom domain. Commands assume Ubuntu 24.04 LTS on the instance and a local
machine with `git` and an SSH client.

Replace these placeholders throughout:

| Placeholder | Meaning |
| --- | --- |
| `meditrack.example.com` | the hostname you are publishing on |
| `<owner>/<repo>` | the GitHub repository |
| `<elastic-ip>` | the instance's public IPv4 address |
| `meditrack-key.pem` | your EC2 key pair file |

---

## 1. Supabase

1. Create a project at <https://supabase.com/dashboard> and pick a region close
   to your users. Store the database password somewhere safe.
2. Open **SQL Editor → New query**, paste the whole of
   [`supabase/schema.sql`](../supabase/schema.sql) and run it. It creates the
   tables, enums, row level security policies, the signup trigger and both
   storage buckets. The script is idempotent, so re-running it is safe.
3. Under **Authentication → URL Configuration** set:
   - **Site URL** — `https://meditrack.example.com`
   - **Redirect URLs** — `https://meditrack.example.com/auth/callback`
     (add `http://localhost:3000/auth/callback` too while developing)
4. Under **Authentication → Providers → Email**, decide whether to keep
   "Confirm email" on. With it on, a new account has to open the emailed link
   before it can sign in; the app shows the right message either way.
5. Copy **Project Settings → API → Project URL** and the **anon public** key.
   Those are the only two Supabase values the app needs. The service role key
   is never used, so it never has to leave the dashboard.

Verify the buckets exist under **Storage**: `medical-records` (private) and
`avatars` (public).

---

## 2. EC2 instance

1. **Launch instance**
   - AMI: Ubuntu Server 24.04 LTS (64-bit x86)
   - Type: `t3.micro` is enough; `t3.small` builds noticeably faster
   - Key pair: create or reuse one, download the `.pem`
   - Storage: 16 GB gp3
2. **Security group** — inbound rules:

   | Type | Port | Source | Why |
   | --- | --- | --- | --- |
   | SSH | 22 | your IP only | administration |
   | HTTP | 80 | 0.0.0.0/0, ::/0 | Certbot challenge + redirect |
   | HTTPS | 443 | 0.0.0.0/0, ::/0 | the site |

   Do **not** open 3000. The app binds to `127.0.0.1` and is only reachable
   through Nginx.
3. **Elastic IP** — allocate one and associate it with the instance so the
   address survives a stop/start.
4. **Connect**

   ```bash
   chmod 400 meditrack-key.pem
   ssh -i meditrack-key.pem ubuntu@<elastic-ip>
   ```

---

## 3. Provision the host

```bash
sudo apt-get update -y && sudo apt-get install -y git
git clone https://github.com/<owner>/<repo>.git /tmp/meditrack
bash /tmp/meditrack/deploy/scripts/provision.sh
```

`provision.sh` installs Node.js 20, PM2, Nginx, Certbot and UFW, adds a 2 GB
swap file (a 1 GB instance cannot finish `next build` without it), and creates
`/var/www/meditrack` and `/var/log/meditrack`.

Then put the application in place:

```bash
git clone https://github.com/<owner>/<repo>.git /var/www/meditrack
cd /var/www/meditrack
cp .env.example .env
nano .env
```

Fill in:

```ini
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
NEXT_PUBLIC_SITE_URL=https://meditrack.example.com
NODE_ENV=production
PORT=3000
HOSTNAME=127.0.0.1
```

Lock the file down — it is read by PM2 as the `ubuntu` user:

```bash
chmod 600 /var/www/meditrack/.env
```

---

## 4. Build and start under PM2

```bash
cd /var/www/meditrack
bash deploy/scripts/deploy.sh
```

The script installs dependencies with `npm ci`, runs `next build` (which also
copies the static assets next to the standalone server), starts or reloads the
PM2 process from `ecosystem.config.js`, and blocks until `/api/health` answers.

Make PM2 survive a reboot:

```bash
pm2 save
pm2 startup systemd -u ubuntu --hp /home/ubuntu
# run the sudo command it prints, then:
pm2 save
```

Useful checks:

```bash
pm2 status
pm2 logs meditrack --lines 50
curl -s http://127.0.0.1:3000/api/health
```

For every later release, `bash deploy/scripts/deploy.sh` is the only command
you need.

---

## 5. DNS

At your registrar (or Route 53), create an **A** record:

| Name | Type | Value | TTL |
| --- | --- | --- | --- |
| `meditrack` (or `@` for the apex) | A | `<elastic-ip>` | 300 |

Wait for it to propagate before asking Certbot for a certificate:

```bash
dig +short meditrack.example.com
```

The answer must be the Elastic IP. Certbot's HTTP-01 challenge fails otherwise.

---

## 6. Nginx

```bash
sudo cp /var/www/meditrack/deploy/nginx/meditrack.conf \
        /etc/nginx/sites-available/meditrack
sudo sed -i 's/meditrack.example.com/YOUR.REAL.DOMAIN/g' \
        /etc/nginx/sites-available/meditrack
sudo ln -sf /etc/nginx/sites-available/meditrack /etc/nginx/sites-enabled/meditrack
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

`nginx -t` will complain that the certificate files are missing — expected on a
first run. Comment out the four `ssl_*` lines and the whole `listen 443` server
block, reload, obtain the certificate in the next step, and Certbot will write
them back correctly.

The configuration sets a reverse proxy to `127.0.0.1:3000`, forwards the real
client IP and scheme, caps uploads at 12 MB, gzips text responses, caches
`/_next/static` hard, and rate limits `/login`, `/signup` and `/auth`.

---

## 7. HTTPS with Let's Encrypt

```bash
sudo certbot --nginx -d meditrack.example.com --agree-tos -m you@example.com --redirect
```

Certbot validates over HTTP-01, writes the certificate paths into the site file
and installs the HTTP→HTTPS redirect.

Renewal is handled by the `certbot.timer` systemd unit that ships with the
package. Confirm it:

```bash
systemctl list-timers | grep certbot
sudo certbot renew --dry-run
```

Verify the result:

```bash
curl -I https://meditrack.example.com
curl -s https://meditrack.example.com/api/health
```

You want `HTTP/2 200`, a `strict-transport-security` header, and
`{"status":"ok",...}` from the health endpoint.

---

## 8. Post-deploy checklist

- [ ] `https://meditrack.example.com` loads with a valid certificate
- [ ] `http://` redirects to `https://`
- [ ] Sign up as a doctor, publish consulting hours under **Consulting hours**
- [ ] Sign up as a patient in a private window, book one of those slots
- [ ] Upload a PDF under **Medical records** and reopen it from the list
- [ ] The doctor confirms the appointment and writes consultation notes
- [ ] A second patient account cannot see the first patient's documents
- [ ] `pm2 status` shows `online`; reboot the instance and check it comes back

---

## Troubleshooting

**502 Bad Gateway** — the app is not listening. `pm2 logs meditrack --lines 50`.
A missing or malformed `.env` is the usual cause.

**Build killed on a 1 GB instance** — swap was not created. Check with
`swapon --show` and re-run `provision.sh`.

**Certbot: "Timeout during connect"** — port 80 is closed in the security group,
or DNS has not propagated. Re-check both, then retry.

**Login succeeds then bounces back to /login** — `NEXT_PUBLIC_SITE_URL` does not
match the browser's address, or the redirect URL is missing in Supabase
**Authentication → URL Configuration**.

**Uploads fail with a policy error** — `supabase/schema.sql` was only partly
applied. Re-run the whole file; it is idempotent.

**Static assets 404 after a deploy** — the standalone copy step did not run. Use
`npm run build`, not `npx next build`, or run
`node scripts/prepare-standalone.mjs` afterwards.
