import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BriefcaseMedical, Languages, MapPin, Wallet } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { requireSession } from "@/lib/auth";
import { BOOKING_WINDOW_DAYS, WEEKDAYS } from "@/lib/constants";
import { getDoctor, listAvailability, listDoctorBookings } from "@/lib/queries";
import { formatCurrency, formatTimeOfDay } from "@/lib/utils";

import { BookingPanel } from "./booking-panel";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const doctor = await getDoctor(id);
  return {
    title: doctor?.profile?.full_name ?? "Doctor",
    description: doctor
      ? `Book a consultation with ${doctor.profile?.full_name} — ${doctor.specialization}.`
      : undefined,
  };
}

export default async function DoctorProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [{ profile }, { id }] = await Promise.all([requireSession(), params]);

  const doctor = await getDoctor(id);
  if (!doctor) notFound();

  const from = new Date().toISOString();
  const to = new Date(
    Date.now() + BOOKING_WINDOW_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();

  const [availability, bookings] = await Promise.all([
    listAvailability(doctor.id),
    listDoctorBookings(doctor.id, from, to),
  ]);

  const isPatient = profile.role === "patient";
  const blockedReason = !isPatient
    ? "You are signed in with a doctor account, so booking is disabled."
    : !doctor.is_accepting
      ? "This doctor has paused new bookings. You can still view their consulting hours."
      : undefined;

  const grouped = WEEKDAYS.map((label, weekday) => ({
    label,
    windows: availability.filter((slot) => slot.weekday === weekday),
  })).filter((day) => day.windows.length > 0);

  return (
    <div className="space-y-8">
      <Link
        href="/doctors"
        className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-900"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to directory
      </Link>

      <div className="grid gap-6 lg:grid-cols-[1fr_420px] lg:items-start">
        <div className="space-y-6">
          <section className="card p-7">
            <div className="flex flex-wrap items-start gap-5">
              <Avatar
                name={doctor.profile?.full_name ?? "Doctor"}
                src={doctor.profile?.avatar_url}
                size="lg"
              />
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl font-bold tracking-tight text-ink-900">
                  {doctor.profile?.full_name}
                </h1>
                <p className="mt-0.5 font-medium text-brand-700">
                  {doctor.specialization}
                </p>
                {doctor.qualifications ? (
                  <p className="mt-1 text-sm text-ink-500">{doctor.qualifications}</p>
                ) : null}
              </div>
              <span
                className={
                  doctor.is_accepting
                    ? "badge bg-brand-50 text-brand-700 ring-1 ring-brand-200"
                    : "badge bg-ink-100 text-ink-500 ring-1 ring-ink-200"
                }
              >
                {doctor.is_accepting ? "Accepting patients" : "Not accepting"}
              </span>
            </div>

            {doctor.bio ? (
              <p className="mt-6 text-sm leading-relaxed text-ink-600">{doctor.bio}</p>
            ) : null}

            <dl className="mt-6 grid gap-4 border-t border-ink-100 pt-6 sm:grid-cols-2">
              <Detail icon={BriefcaseMedical} label="Experience">
                {doctor.years_experience}{" "}
                {doctor.years_experience === 1 ? "year" : "years"}
              </Detail>
              <Detail icon={Wallet} label="Consultation fee">
                {doctor.consultation_fee > 0
                  ? formatCurrency(doctor.consultation_fee)
                  : "Discussed at the clinic"}
              </Detail>
              <Detail icon={Languages} label="Languages">
                {doctor.languages.join(", ")}
              </Detail>
              <Detail icon={MapPin} label="Clinic">
                {doctor.clinic_name ?? "Not listed"}
                {doctor.clinic_address ? (
                  <span className="block text-xs text-ink-400">
                    {doctor.clinic_address}
                  </span>
                ) : null}
              </Detail>
            </dl>
          </section>

          {grouped.length ? (
            <section className="card p-7">
              <h2 className="text-lg font-semibold text-ink-900">
                Weekly consulting hours
              </h2>
              <ul className="mt-4 divide-y divide-ink-100">
                {grouped.map((day) => (
                  <li
                    key={day.label}
                    className="flex items-start justify-between gap-4 py-3 text-sm"
                  >
                    <span className="font-medium text-ink-700">{day.label}</span>
                    <span className="text-right text-ink-600">
                      {day.windows.map((window) => (
                        <span key={window.id} className="block">
                          {formatTimeOfDay(window.start_time)} –{" "}
                          {formatTimeOfDay(window.end_time)}
                          <span className="ml-1.5 text-xs text-ink-400">
                            ({window.slot_minutes} min slots)
                          </span>
                        </span>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        <BookingPanel
          doctorId={doctor.id}
          availability={availability}
          bookings={bookings}
          canBook={isPatient && doctor.is_accepting}
          blockedReason={blockedReason}
        />
      </div>
    </div>
  );
}

function Detail({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-ink-100 text-ink-500">
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <div className="min-w-0">
        <dt className="text-xs uppercase tracking-wide text-ink-400">{label}</dt>
        <dd className="text-sm font-medium text-ink-800">{children}</dd>
      </div>
    </div>
  );
}
