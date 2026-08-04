"use client";

import { useActionState } from "react";

import { updateProfile, type SettingsState } from "@/app/(app)/settings/actions";
import { Alert } from "@/components/ui/alert";
import { SubmitButton } from "@/components/ui/submit-button";
import { BLOOD_GROUPS } from "@/lib/constants";
import type { Profile } from "@/lib/types/database";

export function ProfileForm({ profile }: { profile: Profile }) {
  const [state, formAction] = useActionState<SettingsState, FormData>(
    updateProfile,
    {}
  );

  const isPatient = profile.role === "patient";

  return (
    <form action={formAction} className="card space-y-5 p-6">
      <div>
        <h2 className="font-semibold text-ink-900">Personal details</h2>
        <p className="mt-1 text-sm text-ink-500">
          {isPatient
            ? "Doctors you book with see this alongside your appointment."
            : "Your name appears on the public doctor directory."}
        </p>
      </div>

      {state.error ? <Alert variant="error">{state.error}</Alert> : null}
      {state.notice ? <Alert variant="success">{state.notice}</Alert> : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="full_name">
            Full name
          </label>
          <input
            id="full_name"
            name="full_name"
            defaultValue={profile.full_name}
            required
            className="field"
          />
        </div>

        <div>
          <label className="label" htmlFor="email">
            Email address
          </label>
          <input id="email" value={profile.email} disabled className="field" />
          <p className="mt-1.5 text-xs text-ink-400">
            Sign-in address; contact support to change it.
          </p>
        </div>

        <div>
          <label className="label" htmlFor="phone">
            Phone
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            defaultValue={profile.phone ?? ""}
            className="field"
            placeholder="+92 300 1234567"
          />
        </div>

        {isPatient ? (
          <>
            <div>
              <label className="label" htmlFor="date_of_birth">
                Date of birth
              </label>
              <input
                id="date_of_birth"
                name="date_of_birth"
                type="date"
                defaultValue={profile.date_of_birth ?? ""}
                className="field"
              />
            </div>

            <div>
              <label className="label" htmlFor="blood_group">
                Blood group
              </label>
              <select
                id="blood_group"
                name="blood_group"
                defaultValue={profile.blood_group ?? ""}
                className="field"
              >
                <option value="">Not specified</option>
                {BLOOD_GROUPS.map((group) => (
                  <option key={group} value={group}>
                    {group}
                  </option>
                ))}
              </select>
            </div>
          </>
        ) : null}
      </div>

      {isPatient ? (
        <div>
          <label className="label" htmlFor="address">
            Address
          </label>
          <textarea
            id="address"
            name="address"
            rows={2}
            defaultValue={profile.address ?? ""}
            className="field resize-y"
            placeholder="House 12, Street 4, Gulberg III, Lahore"
          />
        </div>
      ) : null}

      <SubmitButton pendingLabel="Saving…">Save details</SubmitButton>
    </form>
  );
}
