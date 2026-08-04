"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Stethoscope, UserRound } from "lucide-react";

import { signUp, type AuthState } from "@/app/auth/actions";
import { Alert } from "@/components/ui/alert";
import { SubmitButton } from "@/components/ui/submit-button";
import { SPECIALIZATIONS } from "@/lib/constants";
import type { UserRole } from "@/lib/types/database";
import { cn } from "@/lib/utils";

const ROLE_OPTIONS = [
  {
    value: "patient" as const,
    label: "I am a patient",
    hint: "Book appointments and store reports",
    icon: UserRound,
  },
  {
    value: "doctor" as const,
    label: "I am a doctor",
    hint: "Publish hours and manage a queue",
    icon: Stethoscope,
  },
];

export function SignupForm({ initialRole }: { initialRole: UserRole }) {
  const [state, formAction] = useActionState<AuthState, FormData>(signUp, {});
  const [role, setRole] = useState<UserRole>(initialRole);

  return (
    <form action={formAction} className="space-y-5">
      {state.error ? <Alert variant="error">{state.error}</Alert> : null}
      {state.notice ? <Alert variant="success">{state.notice}</Alert> : null}

      <fieldset>
        <legend className="label">I am signing up as</legend>
        <div className="grid grid-cols-2 gap-3">
          {ROLE_OPTIONS.map(({ value, label, hint, icon: Icon }) => (
            <label
              key={value}
              className={cn(
                "cursor-pointer rounded-xl border p-3.5 transition-colors",
                role === value
                  ? "border-brand-500 bg-brand-50 ring-2 ring-brand-500/20"
                  : "border-ink-200 bg-white hover:border-ink-300"
              )}
            >
              <input
                type="radio"
                name="role"
                value={value}
                checked={role === value}
                onChange={() => setRole(value)}
                className="sr-only"
              />
              <Icon
                className={cn(
                  "h-5 w-5",
                  role === value ? "text-brand-600" : "text-ink-400"
                )}
                aria-hidden="true"
              />
              <span className="mt-2 block text-sm font-semibold text-ink-900">
                {label}
              </span>
              <span className="mt-0.5 block text-xs text-ink-500">{hint}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label className="label" htmlFor="full_name">
          Full name
        </label>
        <input
          id="full_name"
          name="full_name"
          type="text"
          autoComplete="name"
          required
          className="field"
          placeholder={role === "doctor" ? "Dr. Sana Ahmed" : "Ayesha Khan"}
        />
      </div>

      {role === "doctor" ? (
        <div>
          <label className="label" htmlFor="specialization">
            Speciality
          </label>
          <select id="specialization" name="specialization" required className="field">
            {SPECIALIZATIONS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="email">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="field"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label className="label" htmlFor="phone">
            Phone <span className="font-normal text-ink-400">(optional)</span>
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            className="field"
            placeholder="+92 300 1234567"
          />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className="field"
          placeholder="At least 8 characters"
        />
      </div>

      <SubmitButton className="w-full" pendingLabel="Creating account…">
        Create account
      </SubmitButton>

      <p className="text-center text-sm text-ink-500">
        Already registered?{" "}
        <Link href="/login" className="font-semibold text-brand-700 hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
