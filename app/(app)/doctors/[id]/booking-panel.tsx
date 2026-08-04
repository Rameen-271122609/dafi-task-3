"use client";

import { useActionState, useMemo, useState } from "react";
import { CalendarOff } from "lucide-react";

import { bookAppointment, type BookingState } from "@/app/(app)/doctors/actions";
import { Alert } from "@/components/ui/alert";
import { SubmitButton } from "@/components/ui/submit-button";
import { BOOKING_WINDOW_DAYS } from "@/lib/constants";
import { buildDaySlots, upcomingDates } from "@/lib/scheduling";
import type { Appointment, AvailabilitySlot } from "@/lib/types/database";
import { cn } from "@/lib/utils";

export function BookingPanel({
  doctorId,
  availability,
  bookings,
  canBook,
  blockedReason,
}: {
  doctorId: string;
  availability: AvailabilitySlot[];
  bookings: Pick<Appointment, "scheduled_at" | "status">[];
  canBook: boolean;
  blockedReason?: string;
}) {
  const dates = useMemo(() => upcomingDates(BOOKING_WINDOW_DAYS), []);
  const [selectedDate, setSelectedDate] = useState(dates[0]!.value);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [state, formAction] = useActionState<BookingState, FormData>(
    bookAppointment,
    {}
  );

  const slots = useMemo(
    () => buildDaySlots(selectedDate, availability, bookings),
    [selectedDate, availability, bookings]
  );

  const activeSlot = slots.find((slot) => slot.iso === selectedSlot);
  const openSlots = slots.filter((slot) => !slot.taken);

  if (availability.length === 0) {
    return (
      <div className="card p-6">
        <div className="flex items-start gap-3">
          <CalendarOff className="mt-0.5 h-5 w-5 shrink-0 text-ink-400" aria-hidden="true" />
          <div>
            <h3 className="font-semibold text-ink-900">No consulting hours published</h3>
            <p className="mt-1 text-sm text-ink-500">
              This doctor has not opened any slots yet. Check back later or pick another
              doctor from the directory.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="card space-y-6 p-6">
      <input type="hidden" name="doctor_id" value={doctorId} />
      <input type="hidden" name="scheduled_at" value={selectedSlot ?? ""} />
      <input
        type="hidden"
        name="duration_minutes"
        value={activeSlot?.minutes ?? 30}
      />

      <div>
        <h3 className="text-lg font-semibold text-ink-900">Book an appointment</h3>
        <p className="mt-1 text-sm text-ink-500">
          Times are shown in your device&apos;s timezone.
        </p>
      </div>

      {blockedReason ? <Alert variant="info">{blockedReason}</Alert> : null}
      {state.error ? <Alert variant="error">{state.error}</Alert> : null}

      {/* Date rail ---------------------------------------------------- */}
      <div>
        <p className="label">Choose a date</p>
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2">
          {dates.map((date) => {
            const active = date.value === selectedDate;
            return (
              <button
                key={date.value}
                type="button"
                onClick={() => {
                  setSelectedDate(date.value);
                  setSelectedSlot(null);
                }}
                aria-pressed={active}
                className={cn(
                  "flex w-16 shrink-0 flex-col items-center rounded-xl border px-2 py-2.5 transition-colors",
                  active
                    ? "border-brand-600 bg-brand-600 text-white"
                    : "border-ink-200 bg-white text-ink-600 hover:border-ink-300"
                )}
              >
                <span className="text-[11px] uppercase tracking-wide opacity-80">
                  {date.weekday}
                </span>
                <span className="mt-0.5 text-sm font-semibold">{date.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Slots -------------------------------------------------------- */}
      <div>
        <p className="label">
          Available times
          {slots.length ? (
            <span className="ml-1 font-normal text-ink-400">
              ({openSlots.length} of {slots.length} free)
            </span>
          ) : null}
        </p>

        {slots.length === 0 ? (
          <p className="rounded-lg border border-dashed border-ink-200 px-4 py-6 text-center text-sm text-ink-500">
            The clinic is closed on this day. Try another date.
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {slots.map((slot) => (
              <button
                key={slot.iso}
                type="button"
                disabled={slot.taken}
                onClick={() => setSelectedSlot(slot.iso)}
                aria-pressed={selectedSlot === slot.iso}
                className={cn(
                  "rounded-lg border px-2 py-2.5 text-sm font-medium transition-colors",
                  slot.taken
                    ? "cursor-not-allowed border-ink-100 bg-ink-50 text-ink-300 line-through"
                    : selectedSlot === slot.iso
                      ? "border-brand-600 bg-brand-600 text-white"
                      : "border-ink-200 bg-white text-ink-700 hover:border-brand-400 hover:text-brand-700"
                )}
              >
                {slot.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Reason ------------------------------------------------------- */}
      <div>
        <label className="label" htmlFor="reason">
          Reason for the visit
        </label>
        <textarea
          id="reason"
          name="reason"
          rows={3}
          required
          minLength={5}
          className="field resize-y"
          placeholder="Persistent cough for two weeks, worse at night."
        />
      </div>

      <SubmitButton
        className="w-full"
        pendingLabel="Booking…"
        // A slot must be chosen before the action can succeed; the button stays
        // clickable so screen readers still announce the validation message.
      >
        {activeSlot ? `Confirm ${activeSlot.label} slot` : "Select a time slot"}
      </SubmitButton>

      {!canBook ? (
        <p className="text-center text-xs text-ink-400">
          Doctor accounts cannot book appointments.
        </p>
      ) : null}
    </form>
  );
}
