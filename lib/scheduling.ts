import { addMinutes, format, isBefore, parseISO, startOfDay } from "date-fns";

import type { Appointment, AvailabilitySlot } from "@/lib/types/database";

export interface TimeSlot {
  /** ISO instant the consultation starts. */
  iso: string;
  /** `9:30 AM` style label. */
  label: string;
  minutes: number;
  taken: boolean;
}

/**
 * Expands a doctor's recurring weekly windows into concrete slots for one
 * calendar day, marking anything already booked or in the past as taken.
 *
 * `date` is a `yyyy-MM-dd` string interpreted in the viewer's local zone,
 * which is also the zone the times were entered in.
 */
export function buildDaySlots(
  date: string,
  windows: AvailabilitySlot[],
  booked: Pick<Appointment, "scheduled_at" | "status">[]
): TimeSlot[] {
  const day = parseISO(`${date}T00:00:00`);
  if (Number.isNaN(day.getTime())) return [];

  const weekday = day.getDay();
  const now = new Date();

  const takenInstants = new Set(
    booked
      .filter((appointment) => appointment.status !== "cancelled")
      .map((appointment) => new Date(appointment.scheduled_at).getTime())
  );

  const slots: TimeSlot[] = [];

  for (const window of windows.filter((w) => w.weekday === weekday)) {
    const [startHour, startMinute] = window.start_time.split(":").map(Number);
    const [endHour, endMinute] = window.end_time.split(":").map(Number);

    const windowStart = new Date(startOfDay(day));
    windowStart.setHours(startHour ?? 0, startMinute ?? 0, 0, 0);

    const windowEnd = new Date(startOfDay(day));
    windowEnd.setHours(endHour ?? 0, endMinute ?? 0, 0, 0);

    for (
      let cursor = windowStart;
      isBefore(addMinutes(cursor, window.slot_minutes), addMinutes(windowEnd, 1));
      cursor = addMinutes(cursor, window.slot_minutes)
    ) {
      const iso = cursor.toISOString();
      slots.push({
        iso,
        label: format(cursor, "h:mm a"),
        minutes: window.slot_minutes,
        taken: takenInstants.has(cursor.getTime()) || isBefore(cursor, now),
      });
    }
  }

  return slots.sort((a, b) => a.iso.localeCompare(b.iso));
}

/** `yyyy-MM-dd` for the next `count` days starting today. */
export function upcomingDates(count: number): { value: string; label: string; weekday: string }[] {
  const today = startOfDay(new Date());
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() + index);
    return {
      value: format(date, "yyyy-MM-dd"),
      label: format(date, "d MMM"),
      weekday: format(date, "EEE"),
    };
  });
}
