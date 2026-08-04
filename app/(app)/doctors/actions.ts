"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireSession } from "@/lib/auth";
import { BOOKING_WINDOW_DAYS } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";

export interface BookingState {
  error?: string;
}

export async function bookAppointment(
  _prev: BookingState,
  formData: FormData
): Promise<BookingState> {
  const { userId, profile } = await requireSession();

  if (profile.role !== "patient") {
    return { error: "Only patient accounts can book appointments." };
  }

  const doctorId = String(formData.get("doctor_id") ?? "");
  const scheduledAt = String(formData.get("scheduled_at") ?? "");
  const duration = Number(formData.get("duration_minutes") ?? 30);
  const reason = String(formData.get("reason") ?? "").trim();

  if (!doctorId || !scheduledAt) {
    return { error: "Choose a date and a time slot before confirming." };
  }

  if (reason.length < 5) {
    return { error: "Describe the reason for the visit in a few words." };
  }

  const when = new Date(scheduledAt);
  if (Number.isNaN(when.getTime())) {
    return { error: "That time slot is no longer valid. Pick another one." };
  }

  if (when.getTime() < Date.now()) {
    return { error: "That slot is in the past. Pick a later time." };
  }

  const horizon = Date.now() + BOOKING_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  if (when.getTime() > horizon) {
    return { error: `Appointments can be booked up to ${BOOKING_WINDOW_DAYS} days ahead.` };
  }

  const supabase = await createClient();

  const { data: doctor } = await supabase
    .from("doctor_profiles")
    .select("id, is_accepting")
    .eq("id", doctorId)
    .maybeSingle();

  if (!doctor) return { error: "That doctor is no longer listed." };
  if (!doctor.is_accepting) {
    return { error: "This doctor is not accepting new appointments right now." };
  }

  const { data: created, error } = await supabase
    .from("appointments")
    .insert({
      patient_id: userId,
      doctor_id: doctorId,
      scheduled_at: when.toISOString(),
      duration_minutes: Number.isFinite(duration) ? duration : 30,
      reason,
      status: "pending",
    })
    .select("id")
    .single();

  if (error) {
    // The partial unique index rejects a second live booking on the same slot.
    if (error.code === "23505") {
      return { error: "Someone just took that slot. Choose another time." };
    }
    return { error: "The appointment could not be created. Try again." };
  }

  revalidatePath("/appointments");
  revalidatePath("/dashboard");
  redirect(`/appointments/${created.id}?booked=1`);
}
