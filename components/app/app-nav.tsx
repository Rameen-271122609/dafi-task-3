"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  CalendarClock,
  FolderClosed,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Stethoscope,
  Users,
  X,
} from "lucide-react";

import { signOut } from "@/app/auth/actions";
import { Avatar } from "@/components/ui/avatar";
import { Logo } from "@/components/ui/logo";
import type { Profile } from "@/lib/types/database";
import { cn } from "@/lib/utils";

const PATIENT_LINKS = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/appointments", label: "My appointments", icon: CalendarDays },
  { href: "/doctors", label: "Find a doctor", icon: Stethoscope },
  { href: "/records", label: "Medical records", icon: FolderClosed },
  { href: "/settings", label: "Settings", icon: Settings },
];

const DOCTOR_LINKS = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/appointments", label: "Appointment queue", icon: CalendarDays },
  { href: "/availability", label: "Consulting hours", icon: CalendarClock },
  { href: "/patients", label: "Patients", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppNav({ profile }: { profile: Profile }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const links = profile.role === "doctor" ? DOCTOR_LINKS : PATIENT_LINKS;

  const nav = (
    <nav className="flex flex-1 flex-col gap-1">
      {links.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-brand-50 text-brand-700"
                : "text-ink-600 hover:bg-ink-100 hover:text-ink-900"
            )}
          >
            <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
            {label}
          </Link>
        );
      })}
    </nav>
  );

  const account = (
    <div className="border-t border-ink-200 pt-4">
      <div className="flex items-center gap-3 px-1">
        <Avatar name={profile.full_name} src={profile.avatar_url} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink-900">
            {profile.full_name}
          </p>
          <p className="truncate text-xs capitalize text-ink-500">{profile.role}</p>
        </div>
      </div>
      <form action={signOut} className="mt-3">
        <button
          type="submit"
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-600 transition-colors hover:bg-ink-100 hover:text-ink-900"
        >
          <LogOut className="h-[18px] w-[18px]" aria-hidden="true" />
          Sign out
        </button>
      </form>
    </div>
  );

  return (
    <>
      {/* Mobile bar --------------------------------------------------- */}
      <div className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-ink-200 bg-white px-4 lg:hidden">
        <Logo href="/dashboard" />
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="btn-ghost px-2.5"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-ink-900/40"
          />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col bg-white p-5 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <Logo href="/dashboard" />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="btn-ghost px-2.5"
                aria-label="Close navigation"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            {nav}
            {account}
          </div>
        </div>
      ) : null}

      {/* Desktop rail ------------------------------------------------- */}
      <aside className="hidden w-64 shrink-0 border-r border-ink-200 bg-white lg:flex lg:flex-col">
        <div className="flex h-16 items-center border-b border-ink-200 px-5">
          <Logo href="/dashboard" />
        </div>
        <div className="flex flex-1 flex-col p-4">
          {nav}
          {account}
        </div>
      </aside>
    </>
  );
}
