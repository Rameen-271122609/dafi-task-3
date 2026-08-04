/**
 * All appointment times are handled in a single clinic timezone.
 *
 * Instants are stored in Postgres as `timestamptz` (UTC). What varies is how
 * they are *rendered*, and rendering with the host's local zone is wrong in
 * two directions at once: the EC2 box and Vercel both run in UTC, so a 10:30
 * appointment displayed to staff as 05:30, while a patient abroad would see a
 * third time again. Pinning the zone makes the server and the browser agree,
 * which also removes any hydration mismatch.
 */
export const CLINIC_TIMEZONE =
  process.env.NEXT_PUBLIC_CLINIC_TIMEZONE || "Asia/Karachi";

const pad = (value: number) => String(value).padStart(2, "0");

/**
 * Milliseconds to add to a UTC instant to get the clinic's wall clock.
 * Derived from Intl rather than hard coded so daylight saving is handled
 * wherever the clinic happens to be.
 */
function zoneOffsetMs(instant: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: CLINIC_TIMEZONE,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(instant);

  const lookup: Record<string, number> = {};
  for (const part of parts) {
    if (part.type !== "literal") lookup[part.type] = Number(part.value);
  }

  const asIfUtc = Date.UTC(
    lookup.year!,
    lookup.month! - 1,
    lookup.day!,
    lookup.hour! % 24,
    lookup.minute!,
    lookup.second!
  );

  return asIfUtc - instant.getTime();
}

/**
 * Turns a wall clock reading in the clinic's zone into the matching UTC
 * instant. Applied twice so a time that sits on a daylight saving boundary
 * settles on the correct offset.
 */
export function clinicWallTimeToInstant(
  date: string,
  hours: number,
  minutes: number
): Date {
  const naive = new Date(`${date}T${pad(hours)}:${pad(minutes)}:00Z`);
  let instant = new Date(naive.getTime() - zoneOffsetMs(naive));
  instant = new Date(naive.getTime() - zoneOffsetMs(instant));
  return instant;
}

function formatter(options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("en-GB", { timeZone: CLINIC_TIMEZONE, ...options });
}

/** `Wed 5 Aug 2026` */
export function formatClinicDate(value: string | Date) {
  return formatter({ weekday: "short", day: "numeric", month: "short", year: "numeric" })
    .format(new Date(value))
    .replace(",", "");
}

/** `Wednesday 5 August 2026` */
export function formatClinicDateLong(value: string | Date) {
  return formatter({ weekday: "long", day: "numeric", month: "long", year: "numeric" })
    .format(new Date(value))
    .replace(",", "");
}

/** `5 Aug 2026` */
export function formatClinicDateShort(value: string | Date) {
  return formatter({ day: "numeric", month: "short", year: "numeric" }).format(
    new Date(value)
  );
}

/** `10:30 AM` */
export function formatClinicTime(value: string | Date) {
  return formatter({ hour: "numeric", minute: "2-digit", hour12: true })
    .format(new Date(value))
    .toUpperCase();
}

/** `5 Aug 2026, 10:30 AM` */
export function formatClinicDateTime(value: string | Date) {
  return `${formatClinicDateShort(value)}, ${formatClinicTime(value)}`;
}

/** `yyyy-MM-dd` for an instant, as seen in the clinic's zone. */
export function clinicDateKey(value: Date): string {
  const parts = formatter({ year: "numeric", month: "2-digit", day: "2-digit" })
    .formatToParts(value)
    .reduce<Record<string, string>>((acc, part) => {
      if (part.type !== "literal") acc[part.type] = part.value;
      return acc;
    }, {});
  return `${parts.year}-${parts.month}-${parts.day}`;
}

/** Weekday index (0 = Sunday) of a `yyyy-MM-dd` key in the clinic's zone. */
export function weekdayOfDateKey(date: string): number {
  return new Date(`${date}T12:00:00Z`).getUTCDay();
}

/**
 * First and last instant of a clinic-local calendar day, as ISO strings.
 * "Today's appointments" has to mean today at the clinic, not today wherever
 * the server happens to be running.
 */
export function clinicDayRange(reference: Date = new Date()): {
  from: string;
  to: string;
} {
  const key = clinicDateKey(reference);
  const start = clinicWallTimeToInstant(key, 0, 0);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
  return { from: start.toISOString(), to: end.toISOString() };
}
