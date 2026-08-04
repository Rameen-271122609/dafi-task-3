# MediTrack

Appointment scheduling and a shared medical record for independent clinics.

Small practices still run bookings through a phone line and keep patient
history in a paper folder. MediTrack replaces both: doctors publish their
weekly consulting hours once, patients see the genuinely free slots and book in
a couple of taps, and lab reports, prescriptions and scans live in one private
record that the treating doctor can open and nobody else can.

**Live site** · `https://meditrack.example.com`
**Repository** · `https://github.com/<owner>/<repo>`

---

## What it does

**For patients**

- Browse doctors by speciality, experience, clinic and consultation fee
- Pick a real slot from the doctor's published hours — taken and past slots are
  greyed out before you click
- Upload lab reports, prescriptions and scans, and reopen them any time
- Track pending, confirmed, completed and cancelled visits in one queue
- Read the consultation notes the doctor wrote against a visit

**For doctors**

- Publish recurring weekly consulting windows and set the slot length
- Pause new bookings without disappearing from the directory
- Confirm, complete or cancel from a single queue, with today's clinic on the
  overview
- Open a patient's file with their whole history and documents already loaded
- Add a report to a patient's record and write notes against the appointment

**Shared**

- Email and password accounts with a role chosen at signup
- Profile photos, contact details, blood group and clinic information
- Access decided in Postgres, not in the UI

---

## Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 15 (App Router, server components, server actions) |
| Language | TypeScript, strict |
| Styling | Tailwind CSS v4 with a small design-token layer |
| Database | Supabase Postgres with row level security on every table |
| Auth | Supabase Auth (email + password), session refreshed in middleware |
| Files | Supabase Storage — a private `medical-records` bucket and a public `avatars` bucket |
| Process manager | PM2, single fork process bound to loopback |
| Web server | Nginx as a reverse proxy |
| TLS | Let's Encrypt via Certbot, renewed by the systemd timer |
| Host | AWS EC2, Ubuntu 24.04 |

Built in Cursor.

---

## Project layout

```
app/
  (auth)/            sign in and sign up, split-screen layout
  (app)/             everything behind a session
    dashboard/       role-aware overview
    doctors/         directory and the booking page
    appointments/    queue, detail, status actions, consultation notes
    records/         patient's own documents
    patients/        doctor's patient list and per-patient file
    availability/    doctor's weekly consulting hours
    settings/        profile, clinical profile, avatar upload
  api/health/        liveness probe for PM2 and Nginx
  auth/              server actions and the email confirmation callback
components/
  app/               dashboard building blocks
  marketing/         landing page chrome
  ui/                buttons, alerts, avatars, badges, empty states
lib/
  supabase/          browser, server and middleware clients
  queries.ts         every read, in one place
  scheduling.ts      expands weekly windows into bookable slots
  auth.ts            session and role guards
supabase/
  schema.sql         tables, enums, RLS, triggers, buckets — idempotent
  seed.sql           optional demo consulting hours
deploy/
  nginx/             the site configuration
  scripts/           provision.sh and deploy.sh
docs/
  DEPLOYMENT.md      the full EC2 → PM2 → Nginx → SSL runbook
  ARCHITECTURE.md    how the pieces fit and why
```

---

## Running it locally

Requires Node.js 20 or newer.

```bash
git clone https://github.com/<owner>/<repo>.git
cd <repo>
npm install
cp .env.example .env.local
```

Fill `.env.local` with your Supabase project URL and anon key, then apply the
schema: open **SQL Editor** in the Supabase dashboard, paste
[`supabase/schema.sql`](supabase/schema.sql) and run it.

Add `http://localhost:3000/auth/callback` to **Authentication → URL
Configuration → Redirect URLs**, then:

```bash
npm run dev
```

The app is on <http://localhost:3000>. Create one doctor account and one
patient account to walk the whole flow.

### Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | development server |
| `npm run build` | production build, then copies assets into the standalone bundle |
| `npm start` | serve a build without PM2 |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |

---

## Environment

| Variable | Required | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | yes | Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | the **anon public** key |
| `NEXT_PUBLIC_SITE_URL` | on a self-hosted box | absolute origin, used for metadata and auth redirects; inferred automatically on Vercel |
| `NEXT_PUBLIC_CLINIC_TIMEZONE` | no | IANA zone the clinic runs in, default `Asia/Karachi` |
| `PORT` | no | defaults to 3000 |
| `HOSTNAME` | no | defaults to `127.0.0.1` in the PM2 config |

### A note on time

Appointments are stored as `timestamptz` and rendered against a single clinic
timezone rather than the host's. Production servers run in UTC, so formatting
with the system zone would show a 10:30 appointment as 05:30 to staff — and a
different time again to a patient travelling abroad. Pinning the zone in
[`lib/datetime.ts`](lib/datetime.ts) makes the server and the browser agree,
which also removes any hydration mismatch on the booking calendar.

There is no service-role key in this project. Every query runs as the
signed-in user, so row level security is the only thing standing between one
patient's records and another's — which is exactly where that decision belongs.

---

## Security notes

- RLS is enabled on all five tables; policies are in
  [`supabase/schema.sql`](supabase/schema.sql).
- Medical documents sit in a **private** bucket. Links are 60-second signed
  URLs minted per request.
- A doctor can only read a patient's profile and documents while an appointment
  links them, enforced by `public.shares_appointment()`.
- Double booking is prevented by a partial unique index, not by a UI check.
- Nginx adds HSTS, `X-Frame-Options`, `X-Content-Type-Options`, a referrer
  policy and a permissions policy, and rate limits the auth routes.
- The app binds to `127.0.0.1`; only 22, 80 and 443 are open on the instance.

---

## Deployment

The full runbook — Supabase setup, EC2 launch, PM2, Nginx, Certbot and DNS —
is in [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md). The short version, once the
host has been provisioned:

```bash
cd /var/www/meditrack && bash deploy/scripts/deploy.sh
```

---

## Licence

Released for educational and portfolio use.
