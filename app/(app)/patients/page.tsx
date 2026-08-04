import type { Metadata } from "next";
import Link from "next/link";
import { format } from "date-fns";
import { ChevronRight, Users } from "lucide-react";

import { PageHeader } from "@/components/app/page-header";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { requireDoctor } from "@/lib/auth";
import { listDoctorPatients } from "@/lib/queries";

export const metadata: Metadata = { title: "Patients" };

export default async function PatientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const [{ userId }, params] = await Promise.all([requireDoctor(), searchParams]);

  const patients = await listDoctorPatients(userId);
  const search = params.q?.trim().toLowerCase() ?? "";

  const visible = search
    ? patients.filter(
        (entry) =>
          entry.profile.full_name.toLowerCase().includes(search) ||
          entry.profile.email.toLowerCase().includes(search)
      )
    : patients;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Patients"
        description="Everyone who has booked with you, most recent first. Opening a patient shows their history and documents."
      />

      <form className="card flex flex-col gap-3 p-4 sm:flex-row" action="/patients">
        <input
          type="search"
          name="q"
          defaultValue={params.q ?? ""}
          placeholder="Search by name or email"
          className="field flex-1"
          aria-label="Search patients"
        />
        <button type="submit" className="btn-primary sm:w-32">
          Search
        </button>
      </form>

      {visible.length ? (
        <ul className="card divide-y divide-ink-100">
          {visible.map((entry) => (
            <li key={entry.profile.id}>
              <Link
                href={`/patients/${entry.profile.id}`}
                className="flex items-center gap-4 p-5 transition-colors hover:bg-ink-50"
              >
                <Avatar
                  name={entry.profile.full_name}
                  src={entry.profile.avatar_url}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-ink-900">
                    {entry.profile.full_name}
                  </p>
                  <p className="truncate text-sm text-ink-500">
                    {entry.profile.email}
                  </p>
                </div>
                <div className="hidden shrink-0 text-right sm:block">
                  <p className="text-sm font-medium text-ink-800">
                    {entry.visits} {entry.visits === 1 ? "visit" : "visits"}
                  </p>
                  <p className="text-xs text-ink-400">
                    Last {format(new Date(entry.lastVisit), "d MMM yyyy")}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-ink-400" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={Users}
          title={search ? "No patient matches that search" : "No patients yet"}
          description={
            search
              ? "Try a different name or email address."
              : "As soon as someone books one of your published slots they will appear on this list."
          }
        />
      )}
    </div>
  );
}
