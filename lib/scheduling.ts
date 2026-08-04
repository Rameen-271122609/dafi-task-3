import {
  clinicDateKey,
  clinicWallTimeToInstant,
  formatClinicTime,
  weekdayOfDateKey,
} from "@/lib/datetime";
import type { Appointment, AvailabilitySlot } from "@/lib/types/database";

export interface TimeSlot {
  /** ISO instant the consultation starts. */
  iso: string;
  /** `9:30 AM` style label, in the clinic's timezone. */
  label: string;
  minutes: number;
  taken: boolean;
}

/**
 * Expands a doctor's recurring weekly windows into concrete slots for one
 * calendar day, marking anything already booked or in the past as taken.
 *
 * `date` is a `yyyy-MM-dd` key and the window times are wall clock readings,
 * both interpreted in the clinic's timezone, so the result is identical on the
 * server and in the browser.
 */
export function buildDaySlots(
  date: string,
  windows: AvailabilitySlot[],
  booked: Pick<Appointment, "scheduled_at" | "status">[]
): TimeSlot[] {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return [];

  const weekday = weekdayOfDateKey(date);
  const now = Date.now();

  const takenInstants = new Set(
    booked
      .filter((appointment) => appointment.status !== "cancelled")
      .map((appointment) => new Date(appointment.scheduled_at).getTime())
  );

  const slots: TimeSlot[] = [];

  for (const window of windows.filter((w) => w.weekday === weekday)) {
    const [startHour, startMinute] = window.start_time.split(":").map(Number);
    const [endHour, endMinute] = window.end_time.split(":").map(Number);

    const startMinutes = startHour! * 60 + startMinute!;
    const endMinutes = endHour! * 60 + endMinute!;

    for (
      let offset = startMinutes;
      offset + window.slot_minutes <= endMinutes;
      offset += window.slot_minutes
    ) {
      const instant = clinicWallTimeToInstant(
        date,
        Math.floor(offset / 60),
        offset % 60
      );

      slots.push({
        iso: instant.toISOString(),
        label: formatClinicTime(instant),
        minutes: window.slot_minutes,
        taken: takenInstants.has(instant.getTime()) || instant.getTime() <= now,
      });
    }
  }

  return slots.sort((a, b) => a.iso.localeCompare(b.iso));
}

/** The next `count` days, keyed and labelled in the clinic's timezone. */
export function upcomingDates(
  count: number
): { value: string; label: string; weekday: string }[] {
  const todayKey = clinicDateKey(new Date());
  const cursor = new Date(`${todayKey}T12:00:00Z`);

  return Array.from({ length: count }, (_, index) => {
    const day = new Date(cursor);
    day.setUTCDate(cursor.getUTCDate() + index);
    const value = day.toISOString().slice(0, 10);
    return {
      value,
      label: new Intl.DateTimeFormat("en-GB", {
        timeZone: "UTC",
        day: "numeric",
        month: "short",
      }).format(day),
      weekday: new Intl.DateTimeFormat("en-GB", {
        timeZone: "UTC",
        weekday: "short",
      }).format(day),
    };
  });
}
