"use client";

import { useActionState } from "react";

import { updateDoctorProfile, type SettingsState } from "@/app/(app)/settings/actions";
import { Alert } from "@/components/ui/alert";
import { SubmitButton } from "@/components/ui/submit-button";
import { SPECIALIZATIONS } from "@/lib/constants";
import type { DoctorProfile } from "@/lib/types/database";

export function DoctorForm({ doctor }: { doctor: DoctorProfile }) {
  const [state, formAction] = useActionState<SettingsState, FormData>(
    updateDoctorProfile,
    {}
  );

  return (
    <form action={formAction} className="card space-y-5 p-6">
      <div>
        <h2 className="font-semibold text-ink-900">Clinical profile</h2>
        <p className="mt-1 text-sm text-ink-500">
          This is what patients read before they book with you.
        </p>
      </div>

      {state.error ? <Alert variant="error">{state.error}</Alert> : null}
      {state.notice ? <Alert variant="success">{state.notice}</Alert> : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="specialization">
            Speciality
          </label>
          <select
            id="specialization"
            name="specialization"
            defaultValue={doctor.specialization}
            className="field"
          >
            {SPECIALIZATIONS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label" htmlFor="qualifications">
            Qualifications
          </label>
          <input
            id="qualifications"
            name="qualifications"
            defaultValue={doctor.qualifications ?? ""}
            className="field"
            placeholder="MBBS, FCPS (Cardiology)"
          />
        </div>

        <div>
          <label className="label" htmlFor="years_experience">
            Years of experience
          </label>
          <input
            id="years_experience"
            name="years_experience"
            type="number"
            min={0}
            max={70}
            defaultValue={doctor.years_experience}
            className="field"
          />
        </div>

        <div>
          <label className="label" htmlFor="consultation_fee">
            Consultation fee (PKR)
          </label>
          <input
            id="consultation_fee"
            name="consultation_fee"
            type="number"
            min={0}
            step={100}
            defaultValue={doctor.consultation_fee}
            className="field"
          />
        </div>

        <div>
          <label className="label" htmlFor="clinic_name">
            Clinic name
          </label>
          <input
            id="clinic_name"
            name="clinic_name"
            defaultValue={doctor.clinic_name ?? ""}
            className="field"
            placeholder="Gulberg Heart Clinic"
          />
        </div>

        <div>
          <label className="label" htmlFor="languages">
            Languages
          </label>
          <input
            id="languages"
            name="languages"
            defaultValue={doctor.languages.join(", ")}
            className="field"
            placeholder="English, Urdu"
          />
          <p className="mt-1.5 text-xs text-ink-400">Separate with commas.</p>
        </div>
      </div>

      <div>
        <label className="label" htmlFor="clinic_address">
          Clinic address
        </label>
        <textarea
          id="clinic_address"
          name="clinic_address"
          rows={2}
          defaultValue={doctor.clinic_address ?? ""}
          className="field resize-y"
          placeholder="Plot 5, Main Boulevard, Gulberg III, Lahore"
        />
      </div>

      <div>
        <label className="label" htmlFor="bio">
          About you
        </label>
        <textarea
          id="bio"
          name="bio"
          rows={4}
          defaultValue={doctor.bio ?? ""}
          className="field resize-y"
          placeholder="Consultant cardiologist with a focus on preventive care and post-operative follow-up."
        />
      </div>

      <SubmitButton pendingLabel="Saving…">Save clinical profile</SubmitButton>
    </form>
  );
}
