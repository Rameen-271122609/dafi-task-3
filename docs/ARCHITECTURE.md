# Architecture

## Shape of the system

```
Browser
   │  HTTPS
   ▼
Nginx (EC2, :443)  ──  Let's Encrypt certificate, gzip, rate limits, proxy
   │  HTTP to 127.0.0.1:3000
   ▼
Next.js standalone server under PM2
   │  PostgREST + Auth + Storage over HTTPS
   ▼
Supabase (Postgres, GoTrue, Storage)
```

Nothing but Nginx can reach the Node process — it binds to loopback and port
3000 is closed in the security group.

## Why the data rules live in Postgres

Every table has row level security switched on and the app only ever talks to
Supabase with the **anon** key plus the signed-in user's JWT. There is no
service-role key anywhere in the codebase, so a bug in a page or a server
action cannot widen access beyond what the policies allow.

The three rules that matter:

| Data | Who can read it |
| --- | --- |
| `profiles` | yourself, any doctor's public profile, and a patient you have an appointment with |
| `medical_records` | the patient it belongs to, and a doctor who shares an appointment with them |
| `medical-records` bucket | same rule, applied to the first path segment of the object key |

Documents are keyed `<patient_id>/<uuid>-<slug>.<ext>`, so the storage policy
can compare `(storage.foldername(name))[1]` against `auth.uid()` or hand it to
`public.shares_appointment()`.

Two helper functions are `security definer` so they can look past RLS without
exposing rows:

- `public.is_doctor(uid)` — role lookup used inside other policies.
- `public.shares_appointment(doctor, patient)` — the link that grants a doctor
  access to a patient's file.
- `public.booked_slots(doctor, from, to)` — returns only the instants a doctor
  is committed to. Patients need this to see which slots are gone, and it lets
  them do so without reading anybody else's appointment row.

## Booking

Doctors publish recurring weekly windows (`availability_slots`: weekday, start,
end, slot length). The app expands those into concrete slots for one day at a
time in [`lib/scheduling.ts`](../lib/scheduling.ts), and marks a slot taken if
`booked_slots` reports it or it is already in the past.

Expansion runs in the browser so the times shown match the viewer's clock. The
selected instant is sent as an ISO string, and the server re-validates it
against the booking window before inserting.

Two patients can still race for the same slot, so the database has the final
say:

```sql
create unique index appointments_no_double_booking
  on public.appointments (doctor_id, scheduled_at)
  where status in ('pending', 'confirmed');
```

The insert path catches the resulting `23505` and asks the patient to pick
another time. A cancelled appointment drops out of the index, so the slot
re-opens automatically.

## Uploads

The browser streams the file straight into Supabase Storage with the user's own
session, then calls a server action that writes the metadata row. Two reasons:

1. The file never passes through the Node process, so there is no body size
   limit to tune and no memory spike on a small instance.
2. The storage policy is the first gate. If it rejects the upload, no row is
   ever attempted.

If the metadata insert is refused after a successful upload, the action deletes
the object again rather than leaving it orphaned.

Reads go the other way: `getRecordUrl` mints a 60-second signed URL, so a
document link cannot be forwarded or bookmarked usefully.

## Rendering

Everything under `app/(app)` is dynamic — it depends on the session cookie.
`middleware.ts` refreshes the Supabase session on each request and redirects
anonymous traffic to `/login?next=…`, so pages can assume a user exists.

Server components read data through [`lib/queries.ts`](../lib/queries.ts);
mutations are server actions co-located with the route that uses them. Client
components are limited to the parts that genuinely need state — the slot
picker, the uploader, the navigation drawer.

## Build and process model

`next.config.ts` sets `output: "standalone"`, so `next build` emits a
self-contained server in `.next/standalone`. `scripts/prepare-standalone.mjs`
copies `.next/static` and `public` next to it, and PM2 runs `server.js`
directly. The production host therefore never needs the full `node_modules`
tree at runtime, which keeps a 1 GB instance comfortable.
