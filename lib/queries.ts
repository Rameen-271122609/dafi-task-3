import { createClient } from "@/lib/supabase/server";
import type {
  AppointmentDetail,
  AppointmentStatus,
  AvailabilitySlot,
  DoctorWithProfile,
  MedicalRecord,
  Profile,
} from "@/lib/types/database";

/**
 * Column lists that hydrate embedded relations. They are widened to `string`
 * so PostgREST's compile-time select parser stays out of the way — the shapes
 * are asserted explicitly where each query returns.
 */
const APPOINTMENT_DETAIL: string = `
  *,
  patient:profiles!appointments_patient_id_fkey (
    id, full_name, email, phone, avatar_url
  ),
  doctor:doctor_profiles!appointments_doctor_id_fkey (
    *,
    profile:profiles!doctor_profiles_id_fkey (*)
  )
`;

const DOCTOR_WITH_PROFILE: string = `
  *,
  profile:profiles!doctor_profiles_id_fkey (*)
`;

export async function listDoctors(filters?: {
  specialization?: string;
  search?: string;
}): Promise<DoctorWithProfile[]> {
  const supabase = await createClient();

  let query = supabase
    .from("doctor_profiles")
    .select(DOCTOR_WITH_PROFILE)
    .order("years_experience", { ascending: false });

  if (filters?.specialization) {
    query = query.eq("specialization", filters.specialization);
  }

  const { data, error } = await query;
  if (error) throw error;

  const doctors = (data ?? []) as unknown as DoctorWithProfile[];
  const search = filters?.search?.trim().toLowerCase();

  if (!search) return doctors;

  return doctors.filter(
    (doctor) =>
      doctor.profile?.full_name.toLowerCase().includes(search) ||
      doctor.specialization.toLowerCase().includes(search) ||
      (doctor.clinic_name ?? "").toLowerCase().includes(search)
  );
}

export async function getDoctor(id: string): Promise<DoctorWithProfile | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("doctor_profiles")
    .select(DOCTOR_WITH_PROFILE)
    .eq("id", id)
    .maybeSingle();

  return (data as unknown as DoctorWithProfile) ?? null;
}

export async function listAvailability(doctorId: string): Promise<AvailabilitySlot[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("availability_slots")
    .select("*")
    .eq("doctor_id", doctorId)
    .order("weekday")
    .order("start_time");

  return data ?? [];
}

/**
 * Instants a doctor is already committed to, used to grey out taken slots.
 * Goes through a security definer function because row level security stops a
 * patient reading another patient's appointment row.
 */
export async function listDoctorBookings(
  doctorId: string,
  from: string,
  to: string
): Promise<Array<{ scheduled_at: string; status: "confirmed" }>> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("booked_slots", {
    doctor: doctorId,
    range_start: from,
    range_end: to,
  });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    scheduled_at: row.scheduled_at,
    status: "confirmed" as const,
  }));
}

export async function listAppointments(options: {
  role: "patient" | "doctor";
  userId: string;
  from?: string;
  to?: string;
  statuses?: AppointmentStatus[];
  limit?: number;
  ascending?: boolean;
}): Promise<AppointmentDetail[]> {
  const supabase = await createClient();

  let query = supabase
    .from("appointments")
    .select(APPOINTMENT_DETAIL)
    .eq(options.role === "doctor" ? "doctor_id" : "patient_id", options.userId)
    .order("scheduled_at", { ascending: options.ascending ?? true });

  if (options.from) query = query.gte("scheduled_at", options.from);
  if (options.to) query = query.lte("scheduled_at", options.to);
  if (options.statuses?.length) query = query.in("status", options.statuses);
  if (options.limit) query = query.limit(options.limit);

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []) as unknown as AppointmentDetail[];
}

export async function getAppointment(id: string): Promise<AppointmentDetail | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("appointments")
    .select(APPOINTMENT_DETAIL)
    .eq("id", id)
    .maybeSingle();

  return (data as unknown as AppointmentDetail) ?? null;
}

export async function getProfile(id: string): Promise<Profile | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  return data ?? null;
}

export async function listRecords(patientId: string): Promise<MedicalRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("medical_records")
    .select("*")
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

/** Distinct patients a doctor has ever had an appointment with. */
export async function listDoctorPatients(doctorId: string): Promise<
  Array<{ profile: Profile; visits: number; lastVisit: string }>
> {
  const supabase = await createClient();
  const patientJoin: string = `scheduled_at, patient:profiles!appointments_patient_id_fkey (*)`;

  const { data, error } = await supabase
    .from("appointments")
    .select(patientJoin)
    .eq("doctor_id", doctorId)
    .order("scheduled_at", { ascending: false });

  if (error) throw error;

  const rows = (data ?? []) as unknown as Array<{
    scheduled_at: string;
    patient: Profile | null;
  }>;

  const byPatient = new Map<string, { profile: Profile; visits: number; lastVisit: string }>();

  for (const row of rows) {
    if (!row.patient) continue;
    const existing = byPatient.get(row.patient.id);
    if (existing) {
      existing.visits += 1;
      if (row.scheduled_at > existing.lastVisit) existing.lastVisit = row.scheduled_at;
    } else {
      byPatient.set(row.patient.id, {
        profile: row.patient,
        visits: 1,
        lastVisit: row.scheduled_at,
      });
    }
  }

  return [...byPatient.values()].sort((a, b) => b.lastVisit.localeCompare(a.lastVisit));
}
