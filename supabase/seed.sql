-- =====================================================================
-- MediTrack — optional demo data
--
-- Run AFTER schema.sql, and only once you have created the accounts you
-- want to demonstrate with. Accounts must be created through the signup
-- form so Supabase Auth owns the credentials; this script only fills in
-- the clinical details and consulting hours those accounts start without.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Flesh out every doctor profile that is still on its defaults.
-- ---------------------------------------------------------------------

update public.doctor_profiles d
set
  qualifications   = coalesce(d.qualifications, 'MBBS, FCPS'),
  bio              = coalesce(
    d.bio,
    'Consultant with a focus on preventive care, long-term follow-up and clear explanations for patients.'
  ),
  years_experience = case when d.years_experience = 0 then 8 else d.years_experience end,
  consultation_fee = case when d.consultation_fee = 0 then 2500 else d.consultation_fee end,
  clinic_name      = coalesce(d.clinic_name, 'MediTrack Partner Clinic'),
  clinic_address   = coalesce(d.clinic_address, 'Main Boulevard, Gulberg III, Lahore'),
  languages        = case
                       when d.languages = array['English']::text[]
                       then array['English', 'Urdu']::text[]
                       else d.languages
                     end;

-- ---------------------------------------------------------------------
-- 2. Give every doctor a Monday–Friday clinic if they have none.
--    Morning 09:00–13:00 and evening 17:00–20:00, in 30 minute slots.
-- ---------------------------------------------------------------------

insert into public.availability_slots (doctor_id, weekday, start_time, end_time, slot_minutes)
select d.id, w.weekday, w.start_time, w.end_time, 30
from public.doctor_profiles d
cross join (
  values
    (1, time '09:00', time '13:00'),
    (2, time '09:00', time '13:00'),
    (3, time '09:00', time '13:00'),
    (4, time '09:00', time '13:00'),
    (5, time '09:00', time '13:00'),
    (1, time '17:00', time '20:00'),
    (3, time '17:00', time '20:00'),
    (5, time '17:00', time '20:00')
) as w (weekday, start_time, end_time)
where not exists (
  select 1 from public.availability_slots s where s.doctor_id = d.id
)
on conflict (doctor_id, weekday, start_time) do nothing;

-- ---------------------------------------------------------------------
-- 3. Sanity check — what the directory will show.
-- ---------------------------------------------------------------------

select
  p.full_name,
  d.specialization,
  d.years_experience,
  d.consultation_fee,
  count(s.id) as consulting_windows
from public.doctor_profiles d
join public.profiles p on p.id = d.id
left join public.availability_slots s on s.doctor_id = d.id
group by p.full_name, d.specialization, d.years_experience, d.consultation_fee
order by p.full_name;
