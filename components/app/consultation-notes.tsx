"use client";

import { useActionState } from "react";

import {
  saveConsultationNotes,
  type AppointmentActionState,
} from "@/app/(app)/appointments/actions";
import { Alert } from "@/components/ui/alert";
import { SubmitButton } from "@/components/ui/submit-button";

export function ConsultationNotes({
  appointmentId,
  notes,
}: {
  appointmentId: string;
  notes: string | null;
}) {
  const [state, formAction] = useActionState<AppointmentActionState, FormData>(
    saveConsultationNotes,
    {}
  );

  return (
    <form action={formAction} className="card space-y-4 p-6">
      <div>
        <h2 className="font-semibold text-ink-900">Consultation notes</h2>
        <p className="mt-1 text-sm text-ink-500">
          Visible to you and to the patient on their appointment page.
        </p>
      </div>

      {state.error ? <Alert variant="error">{state.error}</Alert> : null}
      {state.notice ? <Alert variant="success">{state.notice}</Alert> : null}

      <input type="hidden" name="appointment_id" value={appointmentId} />

      <textarea
        name="doctor_notes"
        rows={6}
        defaultValue={notes ?? ""}
        className="field resize-y"
        placeholder="Findings, diagnosis, medication advised and follow-up plan."
      />

      <SubmitButton pendingLabel="Saving…">Save notes</SubmitButton>
    </form>
  );
}
