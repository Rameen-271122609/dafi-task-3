import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft, Droplet, Mail, MapPin, Phone } from "lucide-react";

import { PageHeader } from "@/components/app/page-header";
import { RecordList } from "@/components/app/record-list";
import { RecordUploader } from "@/components/app/record-uploader";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireDoctor } from "@/lib/auth";
import { getProfile, listAppointments, listRecords } from "@/lib/queries";
import { ageFromDateOfBirth } from "@/lib/utils";

export const metadata: Metadata = { title: "Patient record" };

export default async function PatientRecordPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [{ userId }, { id }] = await Promise.all([requireDoctor(), params]);

  const patient = await getProfile(id);
  if (!patient || patient.role !== "patient") notFound();

  const [history, records] = await Promise.all([
    listAppointments({ role: "doctor", userId, ascending: false }),
    listRecords(id),
  ]);

  const withThisPatient = history.filter(
    (appointment) => appointment.patient_id === id
  );

  // Row level security would already hide the data, but bail out early so the
  // page reads as "not found" rather than rendering an empty shell.
  if (withThisPatient.length === 0) notFound();

  const age = ageFromDateOfBirth(patient.date_of_birth);

  return (
    <div className="space-y-8">
      <Link
        href="/patients"
        className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-900"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to patients
      </Link>

      <PageHeader
        title={patient.full_name}
        description={`${withThisPatient.length} ${
          withThisPatient.length === 1 ? "appointment" : "appointments"
        } with you · ${records.length} ${
          records.length === 1 ? "document" : "documents"
        } on file`}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
        <div className="space-y-8">
          <section>
            <h2 className="mb-4 text-lg font-semibold text-ink-900">
              Appointment history
            </h2>
            <ul className="card divide-y divide-ink-100">
              {withThisPatient.map((appointment) => (
                <li key={appointment.id}>
                  <Link
                    href={`/appointments/${appointment.id}`}
                    className="flex items-start gap-4 p-5 transition-colors hover:bg-ink-50"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="font-medium text-ink-900">
                          {format(
                            new Date(appointment.scheduled_at),
                            "d MMM yyyy, h:mm a"
                          )}
                        </p>
                        <StatusBadge status={appointment.status} />
                      </div>
                      <p className="mt-1.5 line-clamp-2 text-sm text-ink-600">
                        {appointment.reason}
                      </p>
                      {appointment.doctor_notes ? (
                        <p className="mt-2 line-clamp-2 text-sm text-ink-500">
                          <span className="font-medium text-ink-600">Notes:</span>{" "}
                          {appointment.doctor_notes}
                        </p>
                      ) : null}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-ink-900">Documents</h2>
            <RecordList
              records={records}
              canDelete={false}
              emptyDescription="Nothing has been uploaded for this patient yet."
            />
            <RecordUploader
              patientId={id}
              label="Add a document to this patient's record"
            />
          </section>
        </div>

        <aside className="card p-6">
          <div className="flex items-center gap-3">
            <Avatar name={patient.full_name} src={patient.avatar_url} size="lg" />
            <div className="min-w-0">
              <p className="truncate font-semibold text-ink-900">
                {patient.full_name}
              </p>
              <p className="text-sm text-ink-500">
                {age ? `${age} years old` : "Age not provided"}
              </p>
            </div>
          </div>

          <dl className="mt-6 space-y-3 border-t border-ink-100 pt-5 text-sm">
            <Row icon={Mail} label="Email">
              {patient.email}
            </Row>
            {patient.phone ? (
              <Row icon={Phone} label="Phone">
                {patient.phone}
              </Row>
            ) : null}
            {patient.blood_group ? (
              <Row icon={Droplet} label="Blood group">
                {patient.blood_group}
              </Row>
            ) : null}
            {patient.address ? (
              <Row icon={MapPin} label="Address">
                {patient.address}
              </Row>
            ) : null}
          </dl>
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
