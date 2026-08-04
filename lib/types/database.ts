/**
 * Hand-maintained mirror of supabase/schema.sql. Keep the two in sync when
 * the schema changes so queries stay type checked end to end.
 */

export type UserRole = "patient" | "doctor";

export type AppointmentStatus = "pending" | "confirmed" | "completed" | "cancelled";

export type RecordType =
  | "lab_report"
  | "prescription"
  | "scan"
  | "discharge_summary"
  | "other";

export type Profile = {
  id: string;
  full_name: string;
  role: UserRole;
  email: string;
  phone: string | null;
  date_of_birth: string | null;
  blood_group: string | null;
  address: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export type DoctorProfile = {
  id: string;
  specialization: string;
  qualifications: string | null;
  bio: string | null;
  years_experience: number;
  consultation_fee: number;
  clinic_name: string | null;
  clinic_address: string | null;
  languages: string[];
  is_accepting: boolean;
  created_at: string;
  updated_at: string;
}

export type AvailabilitySlot = {
  id: string;
  doctor_id: string;
  weekday: number;
  start_time: string;
  end_time: string;
  slot_minutes: number;
  created_at: string;
}

export type Appointment = {
  id: string;
  patient_id: string;
  doctor_id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: AppointmentStatus;
  reason: string;
  doctor_notes: string | null;
  cancelled_reason: string | null;
  created_at: string;
  updated_at: string;
}

export type MedicalRecord = {
  id: string;
  patient_id: string;
  uploaded_by: string;
  appointment_id: string | null;
  title: string;
  record_type: RecordType;
  notes: string | null;
  file_path: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  created_at: string;
}

/** A doctor row joined with the profile it extends. */
export type DoctorWithProfile = DoctorProfile & { profile: Profile };

/** An appointment joined with both participants. */
export type AppointmentDetail = Appointment & {
  patient: Pick<Profile, "id" | "full_name" | "email" | "phone" | "avatar_url">;
  doctor: DoctorWithProfile;
};

type Row<T> = {
  Row: T;
  Insert: Partial<T>;
  Update: Partial<T>;
  /**
   * Embedded selects are resolved at runtime and the results are narrowed by
   * hand in lib/queries.ts, so the relationship map stays empty here.
   */
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      profiles: Row<Profile>;
      doctor_profiles: Row<DoctorProfile>;
      availability_slots: Row<AvailabilitySlot>;
      appointments: Row<Appointment>;
      medical_records: Row<MedicalRecord>;
    };
    Views: Record<string, never>;
    Functions: {
      booked_slots: {
        Args: { doctor: string; range_start: string; range_end: string };
        Returns: { scheduled_at: string }[];
      };
    };
    Enums: {
      user_role: UserRole;
      appointment_status: AppointmentStatus;
      record_type: RecordType;
    };
    CompositeTypes: Record<string, never>;
  };
}
