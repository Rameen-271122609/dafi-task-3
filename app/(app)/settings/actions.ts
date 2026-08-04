"use server";

import { revalidatePath } from "next/cache";

import { requireSession } from "@/lib/auth";
import { BLOOD_GROUPS, SPECIALIZATIONS } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";

export interface SettingsState {
  error?: string;
  notice?: string;
}

export async function updateProfile(
  _prev: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  const { userId } = await requireSession();

  const fullName = String(formData.get("full_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const dateOfBirth = String(formData.get("date_of_birth") ?? "").trim();
  const bloodGroup = String(formData.get("blood_group") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();

  if (fullName.length < 2) {
    return { error: "Enter the name patients and doctors should see." };
  }

  if (bloodGroup && !BLOOD_GROUPS.includes(bloodGroup as (typeof BLOOD_GROUPS)[number])) {
    return { error: "Choose a valid blood group." };
  }

  if (dateOfBirth) {
    const parsed = new Date(dateOfBirth);
    if (Number.isNaN(parsed.getTime()) || parsed > new Date()) {
      return { error: "Enter a valid date of birth." };
    }
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      phone: phone || null,
      date_of_birth: dateOfBirth || null,
      blood_group: bloodGroup || null,
      address: address || null,
    })
    .eq("id", userId);

  if (error) return { error: "Your details could not be saved. Try again." };

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { notice: "Profile updated." };
}

export async function updateDoctorProfile(
  _prev: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  const { userId, profile } = await requireSession();

  if (profile.role !== "doctor") {
    return { error: "Only doctor accounts have a clinical profile." };
  }

  const specialization = String(formData.get("specialization") ?? "").trim();
  const qualifications = String(formData.get("qualifications") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const experience = Number(formData.get("years_experience") ?? 0);
  const fee = Number(formData.get("consultation_fee") ?? 0);
  const clinicName = String(formData.get("clinic_name") ?? "").trim();
  const clinicAddress = String(formData.get("clinic_address") ?? "").trim();
  const languages = String(formData.get("languages") ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (!SPECIALIZATIONS.includes(specialization as (typeof SPECIALIZATIONS)[number])) {
    return { error: "Choose a speciality from the list." };
  }

  if (!Number.isFinite(experience) || experience < 0 || experience > 70) {
    return { error: "Years of experience must be between 0 and 70." };
  }

  if (!Number.isFinite(fee) || fee < 0) {
    return { error: "The consultation fee cannot be negative." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("doctor_profiles")
    .update({
      specialization,
      qualifications: qualifications || null,
      bio: bio || null,
      years_experience: Math.round(experience),
      consultation_fee: fee,
      clinic_name: clinicName || null,
      clinic_address: clinicAddress || null,
      languages: languages.length ? languages : ["English"],
    })
    .eq("id", userId);

  if (error) return { error: "Your clinical profile could not be saved." };

  revalidatePath("/settings");
  revalidatePath("/doctors");
  revalidatePath(`/doctors/${userId}`);
  return { notice: "Clinical profile updated." };
}

/** Stores the public URL of an avatar the browser has already uploaded. */
export async function setAvatar(
  _prev: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  const { userId } = await requireSession();
  const avatarUrl = String(formData.get("avatar_url") ?? "").trim();

  if (!avatarUrl) return { error: "The photo upload did not complete." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: avatarUrl })
    .eq("id", userId);

  if (error) return { error: "The photo could not be saved." };

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { notice: "Profile photo updated." };
}
