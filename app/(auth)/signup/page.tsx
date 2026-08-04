import type { Metadata } from "next";

import type { UserRole } from "@/lib/types/database";

import { SignupForm } from "./signup-form";

export const metadata: Metadata = { title: "Create an account" };

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const params = await searchParams;
  const initialRole: UserRole = params.role === "doctor" ? "doctor" : "patient";

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-ink-900">
        Create your account
      </h1>
      <p className="mt-1.5 text-sm text-ink-500">
        Takes under a minute. No card details, no setup call.
      </p>

      <div className="mt-7">
        <SignupForm initialRole={initialRole} />
      </div>
    </div>
  );
}
