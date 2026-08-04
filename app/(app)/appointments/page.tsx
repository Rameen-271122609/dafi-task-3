import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays } from "lucide-react";

import { AppointmentCard } from "@/components/app/appointment-card";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { requireSession } from "@/lib/auth";
import { listAppointments } from "@/lib/queries";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Appointments" };

const TABS = [
  { key: "upcoming", label: "Upcoming" },
  { key: "past", label: "Past" },
  { key: "cancelled", label: "Cancelled" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const [{ userId, profile }, params] = await Promise.all([
    requireSession(),
    searchParams,
  ]);

  const tab: TabKey = TABS.some((item) => item.key === params.tab)
    ? (params.tab as TabKey)
    : "upcoming";

  const now = new Date().toISOString();
  const role = profile.role;

  const appointments = await listAppointments(
    tab === "upcoming"
      ? {
          role,
          userId,
          from: now,
          statuses: ["pending", "confirmed"],
          ascending: true,
        }
      : tab === "past"
        ? {
            role,
            userId,
            statuses: ["completed"],
            ascending: false,
          }
        : {
            role,
            userId,
            statuses: ["cancelled"],
            ascending: false,
          }
  );

  const isDoctor = role === "doctor";

  return (
    <div className="space-y-8">
      <PageHeader
        title={isDoctor ? "Appointment queue" : "My appointments"}
        description={
          isDoctor
            ? "Confirm requests, close out finished consultations and keep the queue tidy."
            : "Everything you have booked, past and present."
        }
        action={
          isDoctor ? undefined : (
            <Link href="/doctors" className="btn-primary">
              Book an appointment
            </Link>
          )
        }
      />

      <div className="flex gap-1 rounded-xl border border-ink-200 bg-white p-1">
        {TABS.map((item) => (
          <Link
            key={item.key}
            href={`/appointments?tab=${item.key}`}
            className={cn(
              "flex-1 rounded-lg px-3 py-2 text-center text-sm font-medium transition-colors",
              tab === item.key
                ? "bg-brand-50 text-brand-700"
                : "text-ink-600 hover:bg-ink-50"
            )}
          >
            {item.label}
          </Link>
        ))}
      </div>

      {appointments.length ? (
        <div className="space-y-3">
          {appointments.map((appointment) => (
            <AppointmentCard
              key={appointment.id}
              appointment={appointment}
              viewerRole={role}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={CalendarDays}
          title={
            tab === "upcoming"
              ? "Nothing scheduled"
              : tab === "past"
                ? "No completed consultations yet"
                : "No cancellations"
          }
          description={
            isDoctor
              ? "Bookings from patients appear here the moment they choose one of your published slots."
              : "Pick a doctor from the directory and choose a slot to get started."
          }
          action={
            isDoctor ? undefined : (
              <Link href="/doctors" className="btn-primary">
                Find a doctor
              </Link>
            )
          }
        />
      )}
    </div>
  );
}
