-- =====================================================================
-- MediTrack — database schema
-- Run this once in the Supabase SQL Editor for a fresh project.
-- The script is idempotent and safe to re-run.
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- Enumerated types
-- ---------------------------------------------------------------------

do $$ begin
  create type public.user_role as enum ('patient', 'doctor');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.appointment_status as enum (
    'pending', 'confirmed', 'completed', 'cancelled'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.record_type as enum (
    'lab_report', 'prescription', 'scan', 'discharge_summary', 'other'
  );
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------
-- profiles — one row per authenticated user
-- ---------------------------------------------------------------------

create table if not exists public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  full_name     text        not null,
  role          public.user_role not null default 'patient',
  email         text        not null,
  phone         text,
  date_of_birth date,
  blood_group   text,
  address       text,
  avatar_url    text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists profiles_role_idx on public.profiles (role);

-- ---------------------------------------------------------------------
-- doctor_profiles — clinical details, one row per doctor
-- ---------------------------------------------------------------------

create table if not exists public.doctor_profiles (
  id                uuid primary key references public.profiles (id) on delete cascade,
  specialization    text        not null,
  qualifications    text,
  bio               text,
  years_experience  integer     not null default 0 check (years_experience >= 0),
  consultation_fee  numeric(10, 2) not null default 0 check (consultation_fee >= 0),
  clinic_name       text,
  clinic_address    text,
  languages         text[]      not null default array['English']::text[],
  is_accepting      boolean     not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists doctor_profiles_specialization_idx
  on public.doctor_profiles (specialization);

-- ---------------------------------------------------------------------
-- availability_slots — recurring weekly consulting hours
-- ---------------------------------------------------------------------

create table if not exists public.availability_slots (
  id           uuid primary key default gen_random_uuid(),
  doctor_id    uuid not null references public.doctor_profiles (id) on delete cascade,
  weekday      smallint not null check (weekday between 0 and 6), -- 0 = Sunday
  start_time   time not null,
  end_time     time not null,
  slot_minutes smallint not null default 30 check (slot_minutes between 10 and 120),
  created_at   timestamptz not null default now(),
  constraint availability_slots_range_check check (end_time > start_time),
  constraint availability_slots_unique unique (doctor_id, weekday, start_time)
);

create index if not exists availability_slots_doctor_idx
  on public.availability_slots (doctor_id, weekday);

-- ---------------------------------------------------------------------
-- appointments
-- ---------------------------------------------------------------------

create table if not exists public.appointments (
  id               uuid primary key default gen_random_uuid(),
  patient_id       uuid not null references public.profiles (id) on delete cascade,
  doctor_id        uuid not null references public.doctor_profiles (id) on delete cascade,
  scheduled_at     timestamptz not null,
  duration_minutes smallint not null default 30 check (duration_minutes between 10 and 120),
  status           public.appointment_status not null default 'pending',
  reason           text not null,
  doctor_notes     text,
  cancelled_reason text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists appointments_patient_idx
  on public.appointments (patient_id, scheduled_at desc);
create index if not exists appointments_doctor_idx
  on public.appointments (doctor_id, scheduled_at desc);

-- A doctor cannot hold two live appointments at the same instant.
create unique index if not exists appointments_no_double_booking
  on public.appointments (doctor_id, scheduled_at)
  where status in ('pending', 'confirmed');

-- ---------------------------------------------------------------------
-- medical_records — metadata for files stored in Supabase Storage
-- ---------------------------------------------------------------------

create table if not exists public.medical_records (
  id             uuid primary key default gen_random_uuid(),
  patient_id     uuid not null references public.profiles (id) on delete cascade,
  uploaded_by    uuid not null references public.profiles (id) on delete cascade,
  appointment_id uuid references public.appointments (id) on delete set null,
  title          text not null,
  record_type    public.record_type not null default 'other',
  notes          text,
  file_path      text not null unique,
  file_name      text not null,
  file_size      bigint not null check (file_size > 0),
  mime_type      text not null,
  created_at     timestamptz not null default now()
);

create index if not exists medical_records_patient_idx
  on public.medical_records (patient_id, created_at desc);

-- ---------------------------------------------------------------------
-- Helper functions (security definer so they can bypass RLS safely)
-- ---------------------------------------------------------------------

create or replace function public.is_doctor(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p where p.id = uid and p.role = 'doctor'
  );
$$;

-- True when the doctor and the patient are linked by at least one appointment.
create or replace function public.shares_appointment(doctor uuid, patient uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.appointments a
    where a.doctor_id = doctor
      and a.patient_id = patient
  );
$$;

-- Patients must see which of a doctor's slots are already gone without being
-- able to read anybody else's appointment row, so the instants are exposed
-- through this function instead of a direct select.
create or replace function public.booked_slots(
  doctor      uuid,
  range_start timestamptz,
  range_end   timestamptz
)
returns table (scheduled_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select a.scheduled_at
  from public.appointments a
  where a.doctor_id = doctor
    and a.status in ('pending', 'confirmed')
    and a.scheduled_at >= range_start
    and a.scheduled_at <= range_end;
$$;

revoke all on function public.booked_slots(uuid, timestamptz, timestamptz) from public;
grant execute on function public.booked_slots(uuid, timestamptz, timestamptz) to authenticated;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Creates the profile row (and doctor row where relevant) for a new signup.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_role public.user_role;
begin
  new_role := coalesce(
    nullif(new.raw_user_meta_data ->> 'role', ''),
    'patient'
  )::public.user_role;

  insert into public.profiles (id, full_name, email, role, phone)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(new.email, '@', 1)),
    new.email,
    new_role,
    nullif(new.raw_user_meta_data ->> 'phone', '')
  )
  on conflict (id) do nothing;

  if new_role = 'doctor' then
    insert into public.doctor_profiles (id, specialization)
    values (
      new.id,
      coalesce(nullif(new.raw_user_meta_data ->> 'specialization', ''), 'General Physician')
    )
    on conflict (id) do nothing;
  end if;

  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

drop trigger if exists doctor_profiles_touch on public.doctor_profiles;
create trigger doctor_profiles_touch before update on public.doctor_profiles
  for each row execute function public.touch_updated_at();

drop trigger if exists appointments_touch on public.appointments;
create trigger appointments_touch before update on public.appointments
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------

alter table public.profiles          enable row level security;
alter table public.doctor_profiles   enable row level security;
alter table public.availability_slots enable row level security;
alter table public.appointments      enable row level security;
alter table public.medical_records   enable row level security;

-- profiles ------------------------------------------------------------

drop policy if exists "profiles readable by self, doctors and treating clinicians"
  on public.profiles;
create policy "profiles readable by self, doctors and treating clinicians"
  on public.profiles for select
  using (
    id = auth.uid()
    or role = 'doctor'
    or public.shares_appointment(auth.uid(), id)
  );

drop policy if exists "users insert their own profile" on public.profiles;
create policy "users insert their own profile"
  on public.profiles for insert
  with check (id = auth.uid());

drop policy if exists "users update their own profile" on public.profiles;
create policy "users update their own profile"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- doctor_profiles -----------------------------------------------------

drop policy if exists "doctor directory is public" on public.doctor_profiles;
create policy "doctor directory is public"
  on public.doctor_profiles for select
  using (true);

drop policy if exists "doctors manage their own clinical profile" on public.doctor_profiles;
create policy "doctors manage their own clinical profile"
  on public.doctor_profiles for all
  using (id = auth.uid())
  with check (id = auth.uid());

-- availability_slots --------------------------------------------------

drop policy if exists "availability is public" on public.availability_slots;
create policy "availability is public"
  on public.availability_slots for select
  using (true);

drop policy if exists "doctors manage their own availability" on public.availability_slots;
create policy "doctors manage their own availability"
  on public.availability_slots for all
  using (doctor_id = auth.uid())
  with check (doctor_id = auth.uid());

-- appointments --------------------------------------------------------

drop policy if exists "participants read appointments" on public.appointments;
create policy "participants read appointments"
  on public.appointments for select
  using (patient_id = auth.uid() or doctor_id = auth.uid());

drop policy if exists "patients create their own appointments" on public.appointments;
create policy "patients create their own appointments"
  on public.appointments for insert
  with check (patient_id = auth.uid());

drop policy if exists "participants update appointments" on public.appointments;
create policy "participants update appointments"
  on public.appointments for update
  using (patient_id = auth.uid() or doctor_id = auth.uid())
  with check (patient_id = auth.uid() or doctor_id = auth.uid());

-- medical_records -----------------------------------------------------

drop policy if exists "records visible to owner and treating doctor"
  on public.medical_records;
create policy "records visible to owner and treating doctor"
  on public.medical_records for select
  using (
    patient_id = auth.uid()
    or (public.is_doctor(auth.uid()) and public.shares_appointment(auth.uid(), patient_id))
  );

drop policy if exists "records uploaded by owner or treating doctor"
  on public.medical_records;
create policy "records uploaded by owner or treating doctor"
  on public.medical_records for insert
  with check (
    uploaded_by = auth.uid()
    and (
      patient_id = auth.uid()
      or (public.is_doctor(auth.uid()) and public.shares_appointment(auth.uid(), patient_id))
    )
  );

drop policy if exists "uploader removes their own records" on public.medical_records;
create policy "uploader removes their own records"
  on public.medical_records for delete
  using (uploaded_by = auth.uid() or patient_id = auth.uid());

-- ---------------------------------------------------------------------
-- Storage — private bucket for uploaded documents
-- Files are keyed as  <patient_id>/<uuid>.<ext>  so the first path segment
-- is the access control boundary.
-- ---------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'medical-records',
  'medical-records',
  false,
  10485760, -- 10 MB
  array[
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/webp',
    'text/plain'
  ]
)
on conflict (id) do update
  set file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types,
      public = excluded.public;

drop policy if exists "read own or treated patient documents" on storage.objects;
create policy "read own or treated patient documents"
  on storage.objects for select
  using (
    bucket_id = 'medical-records'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or (
        public.is_doctor(auth.uid())
        and public.shares_appointment(auth.uid(), ((storage.foldername(name))[1])::uuid)
      )
    )
  );

drop policy if exists "upload to own or treated patient folder" on storage.objects;
create policy "upload to own or treated patient folder"
  on storage.objects for insert
  with check (
    bucket_id = 'medical-records'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or (
        public.is_doctor(auth.uid())
        and public.shares_appointment(auth.uid(), ((storage.foldername(name))[1])::uuid)
      )
    )
  );

drop policy if exists "delete own documents" on storage.objects;
create policy "delete own documents"
  on storage.objects for delete
  using (
    bucket_id = 'medical-records'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or owner = auth.uid()
    )
  );

-- ---------------------------------------------------------------------
-- Storage — public bucket for profile photographs
-- ---------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  2097152, -- 2 MB
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update
  set file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types,
      public = excluded.public;

drop policy if exists "avatars are publicly readable" on storage.objects;
create policy "avatars are publicly readable"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "users manage their own avatar" on storage.objects;
create policy "users manage their own avatar"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "users replace their own avatar" on storage.objects;
create policy "users replace their own avatar"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "users delete their own avatar" on storage.objects;
create policy "users delete their own avatar"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
