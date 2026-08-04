import Link from "next/link";

import { Logo } from "@/components/ui/logo";

export function SiteHeader({ signedIn }: { signedIn: boolean }) {
  return (
    <header className="sticky top-0 z-40 border-b border-ink-200/70 bg-white/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo />

        <nav className="hidden items-center gap-8 text-sm font-medium text-ink-600 md:flex">
          <Link href="/#features" className="hover:text-ink-900">
            Features
          </Link>
          <Link href="/#workflow" className="hover:text-ink-900">
            How it works
          </Link>
          <Link href="/doctors" className="hover:text-ink-900">
            Find a doctor
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          {signedIn ? (
            <Link href="/dashboard" className="btn-primary">
              Open dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="btn-ghost hidden sm:inline-flex">
                Sign in
              </Link>
              <Link href="/signup" className="btn-primary">
                Get started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
