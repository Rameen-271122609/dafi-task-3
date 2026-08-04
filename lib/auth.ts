import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { DoctorProfile, Profile } from "@/lib/types/database";

export interface Session {
  userId: string;
  profile: Profile;
  doctor: DoctorProfile | null;
}

/**
 * Loads the signed-in user's profile. Middleware already blocks anonymous
 * traffic to the app routes, so reaching the redirect here means the auth
 * cookie was valid but the profile row is missing.
 */
export async function requireSession(): Promise<Session> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login?error=missing_profile");

  let doctor: DoctorProfile | null = null;
  if (profile.role === "doctor") {
    const { data } = await supabase
      .from("doctor_profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    doctor = data ?? null;
  }

  return { userId: user.id, profile, doctor };
}

/** Same as requireSession but rejects patients. */
export async function requireDoctor(): Promise<Session & { doctor: DoctorProfile }> {
  const session = await requireSession();
  if (session.profile.role !== "doctor" || !session.doctor) {
    redirect("/dashboard");
  }
  return session as Session & { doctor: DoctorProfile };
}

/** Same as requireSession but rejects doctors. */
export async function requirePatient(): Promise<Session> {
  const session = await requireSession();
  if (session.profile.role !== "patient") {
    redirect("/dashboard");
  }
  return session;
}

/** Returns the session when there is one, without redirecting. */
export async function optionalSession(): Promise<Session | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  let doctor: DoctorProfile | null = null;
  if (profile.role === "doctor") {
    const { data } = await supabase
      .from("doctor_profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    doctor = data ?? null;
  }

  return { userId: user.id, profile, doctor };
}
