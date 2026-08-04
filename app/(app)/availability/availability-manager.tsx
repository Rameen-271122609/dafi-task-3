"use client";

import { useActionState } from "react";
import { Plus, Trash2 } from "lucide-react";

import {
  addAvailability,
  removeAvailability,
  setAcceptingPatients,
  type AvailabilityState,
} from "@/app/(app)/availability/actions";
import { Alert } from "@/components/ui/alert";
import { SubmitButton } from "@/components/ui/submit-button";
import { WEEKDAYS } from "@/lib/constants";
import type { AvailabilitySlot } from "@/lib/types/database";
import { formatTimeOfDay } from "@/lib/utils";

const SLOT_LENGTHS = [15, 20, 30, 45, 60];

export function AvailabilityManager({
  slots,
  isAccepting,
}: {
  slots: AvailabilitySlot[];
  isAccepting: boolean;
}) {
  const [addState, addAction] = useActionState<AvailabilityState, FormData>(
    addAvailability,
    {}
  );
  const [removeState, removeAction] = useActionState<AvailabilityState, FormData>(
    removeAvailability,
    {}
  );
  const [toggleState, toggleAction] = useActionState<AvailabilityState, FormData>(
    setAcceptingPatients,
    {}
  );

  const byDay = WEEKDAYS.map((label, weekday) => ({
    label,
    weekday,
    windows: slots.filter((slot) => slot.weekday === weekday),
  }));

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
      <div className="space-y-4">
        {removeState.error ? <Alert variant="error">{removeState.error}</Alert> : null}
        {removeState.notice ? (
          <Alert variant="success">{removeState.notice}</Alert>
        ) : null}

        <div className="card divide-y divide-ink-100">
          {byDay.map((day) => (
            <div key={day.label} className="flex items-start gap-6 p-5">
              <p className="w-24 shrink-0 text-sm font-semibold text-ink-800">
                {day.label}
              </p>

              {day.windows.length ? (
                <ul className="flex flex-1 flex-wrap gap-2">
                  {day.windows.map((window) => (
                    <li key={window.id}>
                      <form action={removeAction} className="contents">
                        <input type="hidden" name="slot_id" value={window.id} />
                        <span className="inline-flex items-center gap-2 rounded-lg border border-ink-200 bg-white py-1.5 pl-3 pr-1.5 text-sm text-ink-700">
                          {formatTimeOfDay(window.start_time)} –{" "}
                          {formatTimeOfDay(window.end_time)}
                          <span className="text-xs text-ink-400">
                            {window.slot_minutes}m
                          </span>
                          <button
                            type="submit"
                            className="rounded p-1 text-ink-400 transition-colors hover:bg-red-50 hover:text-red-600"
                            aria-label={`Remove ${day.label} ${formatTimeOfDay(window.start_time)} window`}
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                        </span>
                      </form>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="flex-1 text-sm text-ink-400">Closed</p>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <form action={addAction} className="card space-y-4 p-6">
          <div>
            <h2 className="font-semibold text-ink-900">Add a consulting window</h2>
            <p className="mt-1 text-sm text-ink-500">
              Each window repeats weekly and is split into bookable slots.
            </p>
          </div>

          {addState.error ? <Alert variant="error">{addState.error}</Alert> : null}
          {addState.notice ? <Alert variant="success">{addState.notice}</Alert> : null}

          <div>
            <label className="label" htmlFor="weekday">
              Day
            </label>
            <select id="weekday" name="weekday" className="field" defaultValue="1">
              {WEEKDAYS.map((label, index) => (
                <option key={label} value={index}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="start_time">
                From
              </label>
              <input
                id="start_time"
                name="start_time"
                type="time"
                required
                defaultValue="09:00"
                className="field"
              />
            </div>
            <div>
              <label className="label" htmlFor="end_time">
                To
              </label>
              <input
                id="end_time"
                name="end_time"
                type="time"
                required
                defaultValue="13:00"
                className="field"
              />
            </div>
          </div>

          <div>
            <label className="label" htmlFor="slot_minutes">
              Slot length
            </label>
            <select
              id="slot_minutes"
              name="slot_minutes"
              className="field"
              defaultValue="30"
            >
              {SLOT_LENGTHS.map((minutes) => (
                <option key={minutes} value={minutes}>
                  {minutes} minutes
                </option>
              ))}
            </select>
          </div>

          <SubmitButton className="w-full" pendingLabel="Adding…">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add window
          </SubmitButton>
        </form>

        <form action={toggleAction} className="card space-y-4 p-6">
          <div>
            <h2 className="font-semibold text-ink-900">New bookings</h2>
            <p className="mt-1 text-sm text-ink-500">
              {isAccepting
                ? "Patients can book any free slot in your published hours."
                : "Your profile is visible but new bookings are paused."}
            </p>
          </div>

          {toggleState.error ? <Alert variant="error">{toggleState.error}</Alert> : null}
          {toggleState.notice ? (
            <Alert variant="success">{toggleState.notice}</Alert>
          ) : null}

          <input
            type="hidden"
            name="is_accepting"
            value={isAccepting ? "false" : "true"}
          />
          <SubmitButton
            variant={isAccepting ? "secondary" : "primary"}
            className="w-full"
            pendingLabel="Updating…"
          >
            {isAccepting ? "Pause new bookings" : "Start accepting bookings"}
          </SubmitButton>
        </form>
      </div>
    </div>
  );
}
