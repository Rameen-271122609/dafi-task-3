"use client";

import { useActionState, useState } from "react";
import { CalendarX2, Check, CheckCheck } from "lucide-react";

import {
  updateAppointmentStatus,
  type AppointmentActionState,
} from "@/app/(app)/appointments/actions";
import { Alert } from "@/components/ui/alert";
import { SubmitButton } from "@/components/ui/submit-button";
import type { AppointmentStatus, UserRole } from "@/lib/types/database";

export function AppointmentActions({
  appointmentId,
  status,
  viewerRole,
}: {
  appointmentId: string;
  status: AppointmentStatus;
  viewerRole: UserRole;
}) {
  const [state, formAction] = useActionState<AppointmentActionState, FormData>(
    updateAppointmentStatus,
    {}
  );
  const [cancelling, setCancelling] = useState(false);

  const closed = status === "completed" || status === "cancelled";

  if (closed) {
    return state.notice ? <Alert variant="success">{state.notice}</Alert> : null;
  }

  const isDoctor = viewerRole === "doctor";

  return (
    <div className="space-y-4">
      {state.error ? <Alert variant="error">{state.error}</Alert> : null}
      {state.notice ? <Alert variant="success">{state.notice}</Alert> : null}

      {cancelling ? (
        <form action={formAction} className="card space-y-4 p-5">
          <input type="hidden" name="appointment_id" value={appointmentId} />
          <input type="hidden" name="status" value="cancelled" />

          <div>
            <label className="label" htmlFor="cancelled_reason">
              Reason for cancelling
            </label>
            <textarea
              id="cancelled_reason"
              name="cancelled_reason"
              rows={2}
              className="field resize-y"
              placeholder={
                isDoctor
                  ? "Called away for an emergency; happy to reschedule."
                  : "Feeling better, no longer need the visit."
              }
            />
          </div>

          <div className="flex gap-2">
            <SubmitButton variant="danger" pendingLabel="Cancelling…">
              Confirm cancellation
            </SubmitButton>
            <button
              type="button"
              onClick={() => setCancelling(false)}
              className="btn-ghost"
            >
              Keep appointment
            </button>
          </div>
        </form>
      ) : (
        <div className="flex flex-wrap gap-2">
          {isDoctor && status === "pending" ? (
            <form action={formAction}>
              <input type="hidden" name="appointment_id" value={appointmentId} />
              <input type="hidden" name="status" value="confirmed" />
              <SubmitButton pendingLabel="Confirming…">
                <Check className="h-4 w-4" aria-hidden="true" />
                Confirm appointment
              </SubmitButton>
            </form>
          ) : null}

          {isDoctor && status === "confirmed" ? (
            <form action={formAction}>
              <input type="hidden" name="appointment_id" value={appointmentId} />
              <input type="hidden" name="status" value="completed" />
              <SubmitButton pendingLabel="Saving…">
                <CheckCheck className="h-4 w-4" aria-hidden="true" />
                Mark as completed
              </SubmitButton>
            </form>
          ) : null}

          <button
            type="button"
            onClick={() => setCancelling(true)}
            className="btn-danger"
          >
            <CalendarX2 className="h-4 w-4" aria-hidden="true" />
            Cancel appointment
          </button>
        </div>
      )}
    </div>
  );
}
