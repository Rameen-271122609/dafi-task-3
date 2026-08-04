import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  Droplet,
  Mail,
  MapPin,
  Phone,
  Wallet,
} from "lucide-react";

import { AppointmentActions } from "@/components/app/appointment-actions";
import { ConsultationNotes } from "@/components/app/consultation-notes";
import { RecordList } from "@/components/app/record-list";
import { RecordUploader } from "@/components/app/record-uploader";
import { Alert } from "@/components/ui/alert";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireSession } from "@/lib/auth";
import { getAppointment, getProfile, listRecords } from "@/lib/queries";
import { ageFromDateOfBirth, formatCurrency } from "@/lib/utils";

export const metadata: Metadata = { title: "Appointment" };

export default async function AppointmentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ booked?: string }>;
}) {
  const [{ userId, profile }, { id }, query] = await Promise.all([
    requireSession(),
    params,
    searchParams,
  ]);

  const appointment = await getAppointment(id);
  if (!appointment) notFound();

  const isDoctor = appointment.doctor_id === userId;
  const isPatient = appointment.patient_id === userId;
  if (!isDoctor && !isPatient) notFound();

  const [records, patient] = await Promise.all([
    listRecords(appointment.patient_id),
    isDoctor ? getProfile(appointment.patient_id) : Promise.resolve(null),
  ]);

  const scheduled = new Date(appointment.scheduled_at);
  const counterpart = isDoctor ? appointment.patient : appointment.doctor?.profile;
  const patientAge = ageFromDateOfBirth(patient?.date_of_birth ?? null);

  return (
    <div className="space-y-8">
      <Link
        href="/appointments"
        className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-900"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to appointments
      </Link>

      {query.booked ? (
        <Alert variant="success">
          Your appointment request has been sent. You will see the status change here
          once the doctor confirms it.
        </Alert>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
        <div className="space-y-6">
          {/* Summary ---------------------------------------------------- */}
          <section className="card p-7">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <StatusBadge status={appointment.status} />
                <h1 className="mt-3 text-2xl font-bold tracking-tight text-ink-900">
                  {format(scheduled, "EEEE d MMMM yyyy")}
                </h1>
                <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-600">
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-ink-400" aria-hidden="true" />
                    {format(scheduled, "h:mm a")}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="h-4 w-4 text-ink-400" aria-hidden="true" />
                    {appointment.duration_minutes} minute consultation
                  </span>
                </p>
              </div>
            </div>

            <div className="mt-6 border-t border-ink-100 pt-6">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-400">
                Reason for the visit
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-700">
                {appointment.reason}
              </p>
            </div>

            {appointment.cancelled_reason ? (
              <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4">
                <h2 className="text-sm font-semibold text-red-800">
                  Cancellation note
                </h2>
                <p className="mt-1 text-sm text-red-700">
                  {appointment.cancelled_reason}
                </p>
              </div>
            ) : null}

            {!isDoctor && appointment.doctor_notes ? (
              <div className="mt-6 rounded-lg border border-brand-200 bg-brand-50 p-4">
                <h2 className="text-sm font-semibold text-brand-800">
                  Notes from your doctor
                </h2>
                <p className="mt-1 whitespace-pre-line text-sm text-brand-900">
                  {appointment.doctor_notes}
                </p>
              </div>
            ) : null}
          </section>

          <AppointmentActions
            appointmentId={appointment.id}
            status={appointment.status}
            viewerRole={profile.role}
          />

          {isDoctor ? (
            <ConsultationNotes
              appointmentId={appointment.id}
              notes={appointment.doctor_notes}
            />
          ) : null}

          {/* Documents -------------------------------------------------- */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-ink-900">
              {isDoctor ? "Patient documents" : "Documents on file"}
            </h2>
            <RecordList
              records={records}
              canDelete={isPatient}
              emptyDescription={
                isDoctor
                  ? "This patient has not uploaded anything yet. You can add a report or prescription below."
                  : "Attach lab reports or prior prescriptions so your doctor has the history before the consultation."
              }
            />
            <RecordUploader
              patientId={appointment.patient_id}
              appointmentId={appointment.id}
              label={isDoctor ? "Add a document to this patient's record" : "Upload a document"}
            />
          </section>
        </div>

        {/* Counterpart panel -------------------------------------------- */}
        <aside className="card p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-400">
            {isDoctor ? "Patient" : "Doctor"}
          </h2>

          <div className="mt-4 flex items-center gap-3">
            <Avatar
              name={counterpart?.full_name ?? "?"}
              src={counterpart?.avatar_url}
              size="lg"
            />
            <div className="min-w-0">
              <p className="truncate font-semibold text-ink-900">
                {counterpart?.full_name}
              </p>
              <p className="truncate text-sm text-ink-500">
                {isDoctor
                  ? patientAge
                    ? `${patientAge} years old`
                    : "Patient"
                  : appointment.doctor?.specialization}
              </p>
            </div>
          </div>

          <dl className="mt-6 space-y-3 border-t border-ink-100 pt-5 text-sm">
            {counterpart?.email ? (
              <Row icon={Mail} label="Email">
                {counterpart.email}
              </Row>
            ) : null}
            {counterpart?.phone ? (
              <Row icon={Phone} label="Phone">
                {counterpart.phone}
              </Row>
            ) : null}
            {isDoctor && patient?.blood_group ? (
              <Row icon={Droplet} label="Blood group">
                {patient.blood_group}
              </Row>
            ) : null}
            {!isDoctor && appointment.doctor?.clinic_name ? (
              <Row icon={MapPin} label="Clinic">
                {appointment.doctor.clinic_name}
                {appointment.doctor.clinic_address ? (
                  <span className="block text-xs text-ink-400">
                    {appointment.doctor.clinic_address}
                  </span>
                ) : null}
              </Row>
            ) : null}
            {!isDoctor && (appointment.doctor?.consultation_fee ?? 0) > 0 ? (
              <Row icon={Wallet} label="Fee">
                {formatCurrency(appointment.doctor!.consultation_fee)}
              </Row>
            ) : null}
          </dl>

          {isDoctor ? (
            <Link
              href={`/patients/${appointment.patient_id}`}
              className="btn-secondary mt-6 w-full"
            >
              Open patient record
            </Link>
          ) : (
            <Link
              href={`/doctors/${appointment.doctor_id}`}
              className="btn-secondary mt-6 w-full"
            >
              View doctor profile
            </Link>
          )}
        </aside>
      </div>
    </div>
  );
}

function Row({
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
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" aria-hidden />
      <div className="min-w-0">
        <dt className="text-xs uppercase tracking-wide text-ink-400">{label}</dt>
        <dd className="break-words text-ink-800">{children}</dd>
      </div>
    </div>
  );
}
