import type { AppointmentStatus, RecordType } from "@/lib/types/database";

export const APP_NAME = "MediTrack";
export const APP_TAGLINE = "Clinic scheduling and medical records, in one place";

export const STORAGE_BUCKET = "medical-records";

/** Mirrors the bucket limit declared in supabase/schema.sql. */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export const ACCEPTED_MIME_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "text/plain",
] as const;

export const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export const SPECIALIZATIONS = [
  "General Physician",
  "Cardiology",
  "Dermatology",
  "Endocrinology",
  "ENT",
  "Gastroenterology",
  "Gynaecology",
  "Neurology",
  "Oncology",
  "Ophthalmology",
  "Orthopaedics",
  "Paediatrics",
  "Psychiatry",
  "Pulmonology",
  "Urology",
] as const;

export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;

export const RECORD_TYPE_LABELS: Record<RecordType, string> = {
  lab_report: "Lab report",
  prescription: "Prescription",
  scan: "Scan / imaging",
  discharge_summary: "Discharge summary",
  other: "Other",
};

export const STATUS_LABELS: Record<AppointmentStatus, string> = {
  pending: "Awaiting confirmation",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const STATUS_STYLES: Record<AppointmentStatus, string> = {
  pending: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  confirmed: "bg-brand-50 text-brand-700 ring-1 ring-brand-200",
  completed: "bg-ink-100 text-ink-600 ring-1 ring-ink-200",
  cancelled: "bg-red-50 text-red-700 ring-1 ring-red-200",
};

/** How far ahead patients may book. */
export const BOOKING_WINDOW_DAYS = 30;
