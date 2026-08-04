import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck,
  ClipboardList,
  FileLock2,
  FolderUp,
  ShieldCheck,
  Stethoscope,
  UserRound,
} from "lucide-react";

import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const FEATURES = [
  {
    icon: CalendarCheck,
    title: "Real availability, not a request form",
    body: "Doctors publish weekly consulting hours once. Patients see the exact free slots and confirm in a couple of taps — no phone tag, no double bookings.",
  },
  {
    icon: FolderUp,
    title: "Reports attached to the visit",
    body: "Lab results, prescriptions and scans upload straight to the patient record, so the doctor opens the consultation with the history already in front of them.",
  },
  {
    icon: FileLock2,
    title: "Private by construction",
    body: "Documents live in a private storage bucket. A doctor can only open a file if they share an appointment with that patient — enforced in the database, not the UI.",
  },
  {
    icon: ClipboardList,
    title: "One timeline per patient",
    body: "Every past visit, consultation note and uploaded document sits on a single timeline that both sides can read.",
  },
];

const STEPS = [
  {
    title: "Create your account",
    body: "Sign up as a patient, or as a doctor with your speciality and clinic details.",
  },
  {
    title: "Publish or browse availability",
    body: "Doctors set weekly consulting hours; patients filter the directory by speciality.",
  },
  {
    title: "Book and attach documents",
    body: "Pick a free slot, describe the concern and upload any prior reports.",
  },
  {
    title: "Consult with full context",
    body: "The doctor confirms, reviews the history, and records notes against the visit.",
  },
];

async function fetchStats() {
  if (!isSupabaseConfigured()) return null;

  try {
    const supabase = await createClient();
    const [doctors, specialities] = await Promise.all([
      supabase.from("doctor_profiles").select("id", { count: "exact", head: true }),
      supabase.from("doctor_profiles").select("specialization"),
    ]);

    const uniqueSpecialities = new Set(
      (specialities.data ?? []).map((row) => row.specialization)
    );

    return {
      doctors: doctors.count ?? 0,
      specialities: uniqueSpecialities.size,
    };
  } catch {
    return null;
  }
}

async function isSignedIn() {
  if (!isSupabaseConfigured()) return false;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return Boolean(user);
  } catch {
    return false;
  }
}

export default async function LandingPage() {
  const [stats, signedIn] = await Promise.all([fetchStats(), isSignedIn()]);

  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <SiteHeader signedIn={signedIn} />

      <main className="flex-1">
        {/* Hero ------------------------------------------------------- */}
        <section className="relative overflow-hidden border-b border-ink-100">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(60rem_30rem_at_70%_-10%,var(--color-brand-100),transparent)]"
          />
          <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-4 py-20 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:py-28">
            <div>
              <span className="badge bg-brand-50 text-brand-700 ring-1 ring-brand-200">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                Built for independent clinics
              </span>

              <h1 className="mt-5 text-4xl font-bold leading-[1.1] tracking-tight text-ink-900 sm:text-5xl lg:text-6xl">
                Appointments and medical records,
                <span className="text-brand-600"> finally in one place</span>
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-600">
                Small clinics still run on phone calls and a folder of paper reports.
                MediTrack gives them a live booking page, a shared patient record and
                document storage that only the treating doctor can open.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/signup" className="btn-primary px-6 py-3 text-base">
                  Create a free account
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link href="/doctors" className="btn-secondary px-6 py-3 text-base">
                  Browse doctors
                </Link>
              </div>

              {stats && stats.doctors > 0 ? (
                <dl className="mt-10 flex gap-10">
                  <div>
                    <dt className="text-sm text-ink-500">Doctors on the platform</dt>
                    <dd className="text-2xl font-semibold text-ink-900">
                      {stats.doctors}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-ink-500">Specialities covered</dt>
                    <dd className="text-2xl font-semibold text-ink-900">
                      {stats.specialities}
                    </dd>
                  </div>
                </dl>
              ) : null}
            </div>

            <HeroPreview />
          </div>
        </section>

        {/* Features --------------------------------------------------- */}
        <section id="features" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-24">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
              Everything a small practice actually needs
            </h2>
            <p className="mt-4 text-lg text-ink-600">
              No modules to configure and no per-seat licence. Four things, done
              properly.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <article key={title} className="card p-7">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-5 text-lg font-semibold text-ink-900">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-600">{body}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Workflow --------------------------------------------------- */}
        <section id="workflow" className="border-y border-ink-100 bg-ink-50">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-24">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
                From signup to consultation in four steps
              </h2>
            </div>

            <ol className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((step, index) => (
                <li key={step.title} className="card p-6">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-600 text-sm font-semibold text-white">
                    {index + 1}
                  </span>
                  <h3 className="mt-4 font-semibold text-ink-900">{step.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-600">
                    {step.body}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Audience split --------------------------------------------- */}
        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-24">
          <div className="grid gap-6 lg:grid-cols-2">
            <article className="card p-8">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600">
                <UserRound className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="mt-5 text-xl font-semibold text-ink-900">For patients</h3>
              <ul className="mt-4 space-y-2.5 text-sm text-ink-600">
                <li>• Find a doctor by speciality and see genuine free slots</li>
                <li>• Keep every lab report and prescription in one place</li>
                <li>• Reschedule or cancel without a phone call</li>
                <li>• Carry your history to whichever doctor you see next</li>
              </ul>
              <Link href="/signup?role=patient" className="btn-primary mt-7">
                Sign up as a patient
              </Link>
            </article>

            <article className="card p-8">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600">
                <Stethoscope className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="mt-5 text-xl font-semibold text-ink-900">For doctors</h3>
              <ul className="mt-4 space-y-2.5 text-sm text-ink-600">
                <li>• Publish weekly consulting hours once and stop fielding calls</li>
                <li>• Open each visit with the patient&apos;s documents already loaded</li>
                <li>• Confirm, complete or cancel from a single queue</li>
                <li>• Record consultation notes against the appointment</li>
              </ul>
              <Link href="/signup?role=doctor" className="btn-secondary mt-7">
                Register your practice
              </Link>
            </article>
          </div>
        </section>

        {/* CTA -------------------------------------------------------- */}
        <section className="border-t border-ink-100 bg-ink-900">
          <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Move your clinic off the phone book
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-ink-300">
              Free to set up. Your first bookable slot is about five minutes away.
            </p>
            <Link href="/signup" className="btn-primary mt-8 px-6 py-3 text-base">
              Get started
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

/** Static illustration of the booking screen used in the hero. */
function HeroPreview() {
  return (
    <div className="relative">
      <div className="card overflow-hidden shadow-[var(--shadow-float)]">
        <div className="flex items-center gap-2 border-b border-ink-100 bg-ink-50 px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-brand-400" />
          <span className="ml-3 text-xs text-ink-400">Book an appointment</span>
        </div>

        <div className="space-y-4 p-5">
          <div className="flex items-center gap-3 rounded-xl border border-ink-100 bg-white p-3">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
              SA
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink-900">
                Dr. Sana Ahmed
              </p>
              <p className="truncate text-xs text-ink-500">
                Cardiology · 12 years experience
              </p>
            </div>
            <span className="badge ml-auto bg-brand-50 text-brand-700 ring-1 ring-brand-200">
              Accepting
            </span>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium text-ink-500">Thursday, 6 August</p>
            <div className="grid grid-cols-4 gap-2">
              {["9:00", "9:30", "10:00", "10:30", "11:00", "11:30", "2:00", "2:30"].map(
                (time, index) => (
                  <span
                    key={time}
                    className={
                      index === 3
                        ? "rounded-lg bg-brand-600 px-2 py-2 text-center text-xs font-semibold text-white"
                        : index === 1 || index === 5
                          ? "rounded-lg border border-ink-100 bg-ink-50 px-2 py-2 text-center text-xs text-ink-300 line-through"
                          : "rounded-lg border border-ink-200 px-2 py-2 text-center text-xs text-ink-600"
                    }
                  >
                    {time}
                  </span>
                )
              )}
            </div>
          </div>

          <div className="rounded-xl border border-dashed border-ink-200 bg-ink-50 p-3">
            <div className="flex items-center gap-2 text-xs text-ink-500">
              <FolderUp className="h-4 w-4" aria-hidden="true" />
              blood-panel-july.pdf attached
            </div>
          </div>

          <div className="rounded-lg bg-brand-600 px-4 py-2.5 text-center text-sm font-semibold text-white">
            Confirm 10:30 AM slot
          </div>
        </div>
      </div>
    </div>
  );
}
