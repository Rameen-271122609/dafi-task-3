import Link from "next/link";
import { BriefcaseMedical, MapPin, Wallet } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import type { DoctorWithProfile } from "@/lib/types/database";
import { formatCurrency } from "@/lib/utils";

export function DoctorCard({ doctor }: { doctor: DoctorWithProfile }) {
  const name = doctor.profile?.full_name ?? "Doctor";

  return (
    <article className="card flex flex-col p-6">
      <div className="flex items-start gap-4">
        <Avatar name={name} src={doctor.profile?.avatar_url} size="lg" />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-semibold text-ink-900">{name}</h3>
          <p className="text-sm font-medium text-brand-700">{doctor.specialization}</p>
          {doctor.qualifications ? (
            <p className="mt-0.5 truncate text-xs text-ink-500">
              {doctor.qualifications}
            </p>
          ) : null}
        </div>
        {doctor.is_accepting ? (
          <span className="badge bg-brand-50 text-brand-700 ring-1 ring-brand-200">
            Accepting
          </span>
        ) : (
          <span className="badge bg-ink-100 text-ink-500 ring-1 ring-ink-200">
            Not accepting
          </span>
        )}
      </div>

      {doctor.bio ? (
        <p className="mt-4 line-clamp-2 text-sm leading-relaxed text-ink-600">
          {doctor.bio}
        </p>
      ) : null}

      <dl className="mt-4 grid gap-2.5 text-sm text-ink-600">
        <div className="flex items-center gap-2">
          <BriefcaseMedical className="h-4 w-4 text-ink-400" aria-hidden="true" />
          <dt className="sr-only">Experience</dt>
          <dd>
            {doctor.years_experience}{" "}
            {doctor.years_experience === 1 ? "year" : "years"} of practice
          </dd>
        </div>
        <div className="flex items-center gap-2">
          <Wallet className="h-4 w-4 text-ink-400" aria-hidden="true" />
          <dt className="sr-only">Consultation fee</dt>
          <dd>
            {doctor.consultation_fee > 0
              ? `${formatCurrency(doctor.consultation_fee)} per consultation`
              : "Fee discussed at the clinic"}
          </dd>
        </div>
        {doctor.clinic_name ? (
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-ink-400" aria-hidden="true" />
            <dt className="sr-only">Clinic</dt>
            <dd className="truncate">{doctor.clinic_name}</dd>
          </div>
        ) : null}
      </dl>

      <Link
        href={`/doctors/${doctor.id}`}
        className={doctor.is_accepting ? "btn-primary mt-6" : "btn-secondary mt-6"}
      >
        {doctor.is_accepting ? "View availability" : "View profile"}
      </Link>
    </article>
  );
}
