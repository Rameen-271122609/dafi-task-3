import Link from "next/link";
import { ArrowLeft, CalendarCheck, FileLock2, FolderUp } from "lucide-react";

import { Logo } from "@/components/ui/logo";

const HIGHLIGHTS = [
  {
    icon: CalendarCheck,
    title: "Live availability",
    body: "Consulting hours published once, bookable instantly.",
  },
  {
    icon: FolderUp,
    title: "Documents on file",
    body: "Reports and prescriptions attached to the visit.",
  },
  {
    icon: FileLock2,
    title: "Access you control",
    body: "Only a doctor you have booked can open your records.",
  },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="flex flex-col px-4 py-8 sm:px-8">
        <div className="flex items-center justify-between">
          <Logo />
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-900"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to site
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </div>

      <aside className="relative hidden overflow-hidden bg-ink-900 lg:block">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(40rem_28rem_at_30%_0%,rgba(16,185,129,0.28),transparent)]"
        />
        <div className="relative flex h-full flex-col justify-center px-14">
          <h2 className="max-w-md text-3xl font-bold leading-tight tracking-tight text-white">
            A shared record between the clinic and the people it treats
          </h2>
          <p className="mt-4 max-w-md text-ink-300">
            MediTrack replaces the appointment phone line and the paper file with one
            place both sides can trust.
          </p>

          <ul className="mt-12 space-y-7">
            {HIGHLIGHTS.map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex gap-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/10 text-brand-300">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="font-semibold text-white">{title}</p>
                  <p className="mt-0.5 text-sm text-ink-400">{body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}
