"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/types/database";

export interface AuthState {
  error?: string;
  notice?: string;
}

function readRole(value: FormDataEntryValue | null): UserRole {
  return value === "doctor" ? "doctor" : "patient";
}

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/dashboard");

  if (!email || !password) {
    return { error: "Enter your email address and password." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "Those credentials did not match an account." };
  }

  revalidatePath("/", "layout");
  redirect(next.startsWith("/") ? next : "/dashboard");
}

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const role = readRole(formData.get("role"));
  const specialization = String(formData.get("specialization") ?? "").trim();

  if (!fullName || !email || !password) {
    return { error: "Name, email address and password are all required." };
  }

  if (password.length < 8) {
    return { error: "Choose a password of at least 8 characters." };
  }

  if (role === "doctor" && !specialization) {
    return { error: "Select the speciality you practise in." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, role, phone, specialization },
    },
  });

  if (error) {
    return { error: error.message };
  }

  // With email confirmation switched on, Supabase returns a user without a
  // session and the account is only usable after the emailed link is opened.
  if (data.user && !data.session) {
    return {
      notice: "Check your inbox and open the confirmation link to activate the account.",
    };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
