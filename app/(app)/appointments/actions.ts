"use server";

import { revalidatePath } from "next/cache";

import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { AppointmentStatus } from "@/lib/types/database";

export interface AppointmentActionState {
  error?: string;
  notice?: string;
}

const PATIENT_TRANSITIONS: AppointmentStatus[] = ["cancelled"];
const DOCTOR_TRANSITIONS: AppointmentStatus[] = ["confirmed", "completed", "cancelled"];

export async function updateAppointmentStatus(
  _prev: AppointmentActionState,
  formData: FormData
): Promise<AppointmentActionState> {
  const { userId, profile } = await requireSession();

  const id = String(formData.get("appointment_id") ?? "");
  const status = String(formData.get("status") ?? "") as AppointmentStatus;
  const cancelledReason = String(formData.get("cancelled_reason") ?? "").trim();

  const allowed =
    profile.role === "doctor" ? DOCTOR_TRANSITIONS : PATIENT_TRANSITIONS;

  if (!id || !allowed.includes(status)) {
    return { error: "That change is not available on this appointment." };
  }

  const supabase = await createClient();

  const { data: appointment } = await supabase
    .from("appointments")
    .select("id, status, patient_id, doctor_id")
    .eq("id", id)
    .maybeSingle();

  if (!appointment) return { error: "Appointment not found." };

  const isParticipant =
    appointment.patient_id === userId || appointment.doctor_id === userId;
  if (!isParticipant) return { error: "Appointment not found." };

  if (appointment.status === "completed") {
    return { error: "A completed appointment can no longer be changed." };
  }

  if (appointment.status === "cancelled") {
    return { error: "This appointment was already cancelled." };
  }

  const { error } = await supabase
    .from("appointments")
    .update({
      status,
      cancelled_reason: status === "cancelled" ? cancelledReason || null : null,
    })
    .eq("id", id);

  if (error) return { error: "The appointment could not be updated. Try again." };

  revalidatePath("/appointments");
  revalidatePath(`/appointments/${id}`);
  revalidatePath("/dashboard");

  return {
    notice:
      status === "confirmed"
        ? "Appointment confirmed."
        : status === "completed"
          ? "Appointment marked as completed."
          : "Appointment cancelled.",
  };
}

export async function saveConsultationNotes(
  _prev: AppointmentActionState,
  formData: FormData
): Promise<AppointmentActionState> {
  const { userId, profile } = await requireSession();

  if (profile.role !== "doctor") {
    return { error: "Only the treating doctor can write consultation notes." };
  }

  const id = String(formData.get("appointment_id") ?? "");
  const notes = String(formData.get("doctor_notes") ?? "").trim();

  if (!id) return { error: "Appointment not found." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("appointments")
    .update({ doctor_notes: notes || null })
    .eq("id", id)
    .eq("doctor_id", userId);

  if (error) return { error: "The notes could not be saved. Try again." };

  revalidatePath(`/appointments/${id}`);
  return { notice: "Consultation notes saved." };
}
