import type { Metadata } from "next";

import { Alert } from "@/components/ui/alert";

import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

const ERROR_MESSAGES: Record<string, string> = {
  missing_code: "That confirmation link was incomplete. Request a new one.",
  invalid_code: "That confirmation link has expired. Request a new one.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  const next = params.next?.startsWith("/") ? params.next : "/dashboard";
  const linkError = params.error ? ERROR_MESSAGES[params.error] : undefined;

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-ink-900">Welcome back</h1>
      <p className="mt-1.5 text-sm text-ink-500">
        Sign in to manage your appointments and records.
      </p>

      {linkError ? (
        <Alert variant="error" className="mt-5">
          {linkError}
        </Alert>
      ) : null}

      <div className="mt-7">
        <LoginForm next={next} />
      </div>
    </div>
  );
}
