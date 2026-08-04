import type { Metadata } from "next";
import Link from "next/link";
import { Stethoscope } from "lucide-react";

import { DoctorCard } from "@/components/app/doctor-card";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { requireSession } from "@/lib/auth";
import { SPECIALIZATIONS } from "@/lib/constants";
import { listDoctors } from "@/lib/queries";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Find a doctor" };

export default async function DoctorsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; speciality?: string }>;
}) {
  const [{ profile }, params] = await Promise.all([requireSession(), searchParams]);
  const speciality = params.speciality;
  const search = params.q ?? "";

  const doctors = await listDoctors({ specialization: speciality, search });
  const visible = doctors.filter((doctor) => doctor.id !== profile.id);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Find a doctor"
        description="Filter by speciality, then pick a slot from the doctor's published consulting hours."
      />

      <form className="card flex flex-col gap-3 p-4 sm:flex-row" action="/doctors">
        <input
          type="search"
          name="q"
          defaultValue={search}
          placeholder="Search by name, speciality or clinic"
          className="field flex-1"
          aria-label="Search doctors"
        />
        {speciality ? (
          <input type="hidden" name="speciality" value={speciality} />
        ) : null}
        <button type="submit" className="btn-primary sm:w-32">
          Search
        </button>
      </form>

      <div className="flex flex-wrap gap-2">
        <FilterChip
          href={search ? `/doctors?q=${encodeURIComponent(search)}` : "/doctors"}
          active={!speciality}
        >
          All specialities
        </FilterChip>
        {SPECIALIZATIONS.map((item) => {
          const query = new URLSearchParams({ speciality: item });
          if (search) query.set("q", search);
          return (
            <FilterChip
              key={item}
              href={`/doctors?${query.toString()}`}
              active={speciality === item}
            >
              {item}
            </FilterChip>
          );
        })}
      </div>

      {visible.length ? (
        <div className="grid gap-5 lg:grid-cols-2">
          {visible.map((doctor) => (
            <DoctorCard key={doctor.id} doctor={doctor} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Stethoscope}
          title="No doctors match that search"
          description="Try a different speciality, or clear the filters to see everyone registered on MediTrack."
          action={
            <Link href="/doctors" className="btn-secondary">
              Clear filters
            </Link>
          }
        />
      )}
    </div>
  );
}

function FilterChip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
        active
          ? "border-brand-600 bg-brand-600 text-white"
          : "border-ink-200 bg-white text-ink-600 hover:border-ink-300 hover:text-ink-900"
      )}
    >
      {children}
    </Link>
  );
}
