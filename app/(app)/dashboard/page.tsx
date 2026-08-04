import type { Metadata } from "next";
import Link from "next/link";
import { endOfDay, startOfDay } from "date-fns";
import {
  CalendarCheck,
  CalendarDays,
  CalendarClock,
  FolderClosed,
  Stethoscope,
  Users,
} from "lucide-react";

import { AppointmentCard } from "@/components/app/appointment-card";
import { PageHeader } from "@/components/app/page-header";
import { StatCard } from "@/components/app/stat-card";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { requireSession } from "@/lib/auth";
import {
  listAppointments,
  listAvailability,
  listDoctorPatients,
  listRecords,
} from "@/lib/queries";

export const metadata: Metadata = { title: "Overview" };

export default async function DashboardPage() {
  const session = await requireSession();

  return session.profile.role === "doctor" ? (
    <DoctorOverview userId={session.userId} name={session.profile.full_name} />
  ) : (
    <PatientOverview userId={session.userId} name={session.profile.full_name} />
  );
}

/* -------------------------------------------------------------------- */

async function PatientOverview({ userId, name }: { userId: string; name: string }) {
  const now = new Date().toISOString();

  const [upcoming, past, records] = await Promise.all([
    listAppointments({
      role: "patient",
      userId,
      from: now,
      statuses: ["pending", "confirmed"],
      limit: 5,
    }),
    listAppointments({
      role: "patient",
      userId,
      to: now,
      ascending: false,
      limit: 3,
    }),
    listRecords(userId),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Hello, ${name.split(" ")[0]}`}
        description="Your upcoming visits and everything on file."
        action={
          <Link href="/doctors" className="btn-primary">
            <Stethoscope className="h-4 w-4" aria-hidden="true" />
            Book an appointment
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={CalendarDays}
          label="Upcoming visits"
          value={upcoming.length}
          hint={
            upcoming[0]
              ? `Next with Dr. ${upcoming[0].doctor?.profile?.full_name?.replace(/^Dr\.?\s*/i, "")}`
              : "Nothing booked yet"
          }
        />
        <StatCard
          icon={CalendarCheck}
          label="Past consultations"
          value={past.length}
          hint="Last three shown below"
        />
        <StatCard
          icon={FolderClosed}
          label="Documents on file"
          value={records.length}
          hint="Reports, prescriptions and scans"
        />
      </div>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-ink-900">Upcoming appointments</h2>
        {upcoming.length ? (
          <div className="space-y-3">
            {upcoming.map((appointment) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                viewerRole="patient"
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={CalendarDays}
            title="No appointments booked"
            description="Browse the directory, pick a doctor and choose a free slot from their published consulting hours."
            action={
              <Link href="/doctors" className="btn-primary">
                Find a doctor
              </Link>
            }
          />
        )}
      </section>

      {past.length ? (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-ink-900">Recent history</h2>
          <div className="space-y-3">
            {past.map((appointment) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                viewerRole="patient"
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------- */

async function DoctorOverview({ userId, name }: { userId: string; name: string }) {
  const today = new Date();

  const [todaySchedule, pending, patients, availability] = await Promise.all([
    listAppointments({
      role: "doctor",
      userId,
      from: startOfDay(today).toISOString(),
      to: endOfDay(today).toISOString(),
    }),
    listAppointments({
      role: "doctor",
      userId,
      from: new Date().toISOString(),
      statuses: ["pending"],
    }),
    listDoctorPatients(userId),
    listAvailability(userId),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Good day, ${name.replace(/^Dr\.?\s*/i, "").split(" ")[0]}`}
        description="Today's clinic at a glance."
        action={
          <Link href="/availability" className="btn-secondary">
            <CalendarClock className="h-4 w-4" aria-hidden="true" />
            Consulting hours
          </Link>
        }
      />

      {availability.length === 0 ? (
        <Alert variant="info">
          You have not published any consulting hours yet, so patients cannot book with
          you.{" "}
          <Link href="/availability" className="font-semibold underline">
            Add your weekly hours
          </Link>
          .
        </Alert>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={CalendarDays}
          label="Today's appointments"
          value={todaySchedule.length}
          hint={
            todaySchedule[0]
              ? `First at ${new Date(todaySchedule[0].scheduled_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`
              : "Nothing scheduled today"
          }
        />
        <StatCard
          icon={CalendarCheck}
          label="Awaiting confirmation"
          value={pending.length}
          hint="Requests you have not accepted"
        />
        <StatCard
          icon={Users}
          label="Patients treated"
          value={patients.length}
          hint="Unique patients on your list"
        />
      </div>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-ink-900">Today&apos;s schedule</h2>
        {todaySchedule.length ? (
          <div className="space-y-3">
            {todaySchedule.map((appointment) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                viewerRole="doctor"
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={CalendarDays}
            title="Nothing booked for today"
            description="New bookings land here as soon as a patient picks one of your published slots."
            action={
              <Link href="/appointments" className="btn-secondary">
                View the full queue
              </Link>
            }
          />
        )}
      </section>

      {pending.length ? (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-ink-900">
            Waiting on your confirmation
          </h2>
          <div className="space-y-3">
            {pending.slice(0, 5).map((appointment) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                viewerRole="doctor"
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
