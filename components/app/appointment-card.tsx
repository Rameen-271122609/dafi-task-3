import Link from "next/link";
import { CalendarDays, Clock, MapPin } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatClinicDate, formatClinicTime } from "@/lib/datetime";
import type { AppointmentDetail, UserRole } from "@/lib/types/database";

export function AppointmentCard({
  appointment,
  viewerRole,
}: {
  appointment: AppointmentDetail;
  viewerRole: UserRole;
}) {
  const showingPatient = viewerRole === "doctor";
  const counterpartName = showingPatient
    ? (appointment.patient?.full_name ?? "Patient")
    : `Dr. ${appointment.doctor?.profile?.full_name?.replace(/^Dr\.?\s*/i, "") ?? ""}`.trim();
  const counterpartAvatar = showingPatient
    ? appointment.patient?.avatar_url
    : appointment.doctor?.profile?.avatar_url;
  const subtitle = showingPatient
    ? (appointment.patient?.phone ?? appointment.patient?.email ?? "")
    : appointment.doctor?.specialization;

  return (
    <Link
      href={`/appointments/${appointment.id}`}
      className="card block p-5 transition-shadow hover:shadow-[var(--shadow-float)]"
    >
      <div className="flex items-start gap-4">
        <Avatar name={counterpartName || "?"} src={counterpartAvatar} />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <p className="font-semibold text-ink-900">{counterpartName}</p>
            <StatusBadge status={appointment.status} />
          </div>

          {subtitle ? <p className="mt-0.5 text-sm text-ink-500">{subtitle}</p> : null}

          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-ink-600">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4 text-ink-400" aria-hidden="true" />
              {formatClinicDate(appointment.scheduled_at)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-ink-400" aria-hidden="true" />
              {formatClinicTime(appointment.scheduled_at)} ·{" "}
              {appointment.duration_minutes} min
            </span>
            {!showingPatient && appointment.doctor?.clinic_name ? (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-ink-400" aria-hidden="true" />
                {appointment.doctor.clinic_name}
              </span>
            ) : null}
          </div>

          <p className="mt-3 line-clamp-2 text-sm text-ink-500">{appointment.reason}</p>
        </div>
      </div>
    </Link>
  );
}
