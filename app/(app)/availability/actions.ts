"use server";

import { revalidatePath } from "next/cache";

import { requireDoctor } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export interface AvailabilityState {
  error?: string;
  notice?: string;
}

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

function minutesOfDay(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours! * 60 + minutes!;
}

export async function addAvailability(
  _prev: AvailabilityState,
  formData: FormData
): Promise<AvailabilityState> {
  const { userId } = await requireDoctor();

  const weekday = Number(formData.get("weekday"));
  const startTime = String(formData.get("start_time") ?? "");
  const endTime = String(formData.get("end_time") ?? "");
  const slotMinutes = Number(formData.get("slot_minutes") ?? 30);

  if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) {
    return { error: "Choose a day of the week." };
  }

  if (!TIME_PATTERN.test(startTime) || !TIME_PATTERN.test(endTime)) {
    return { error: "Enter both times in 24 hour HH:MM form." };
  }

  const span = minutesOfDay(endTime) - minutesOfDay(startTime);

  if (span <= 0) {
    return { error: "The end time has to be later than the start time." };
  }

  if (slotMinutes < 10 || slotMinutes > 120) {
    return { error: "Slot length must be between 10 and 120 minutes." };
  }

  if (span < slotMinutes) {
    return { error: "That window is shorter than a single slot." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("availability_slots").insert({
    doctor_id: userId,
    weekday,
    start_time: startTime,
    end_time: endTime,
    slot_minutes: slotMinutes,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "A window already starts at that time on that day." };
    }
    return { error: "The window could not be saved. Try again." };
  }

  revalidatePath("/availability");
  revalidatePath("/dashboard");
  return { notice: "Consulting window added." };
}

export async function removeAvailability(
  _prev: AvailabilityState,
  formData: FormData
): Promise<AvailabilityState> {
  const { userId } = await requireDoctor();

  const id = String(formData.get("slot_id") ?? "");
  if (!id) return { error: "Window not found." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("availability_slots")
    .delete()
    .eq("id", id)
    .eq("doctor_id", userId);

  if (error) return { error: "The window could not be removed." };

  revalidatePath("/availability");
  revalidatePath("/dashboard");
  return { notice: "Consulting window removed." };
}

export async function setAcceptingPatients(
  _prev: AvailabilityState,
  formData: FormData
): Promise<AvailabilityState> {
  const { userId } = await requireDoctor();
  const accepting = formData.get("is_accepting") === "true";

  const supabase = await createClient();
  const { error } = await supabase
    .from("doctor_profiles")
    .update({ is_accepting: accepting })
    .eq("id", userId);

  if (error) return { error: "The setting could not be changed." };

  revalidatePath("/availability");
  revalidatePath("/doctors");
  return {
    notice: accepting
      ? "You are now accepting new appointments."
      : "New bookings are paused.",
  };
}
