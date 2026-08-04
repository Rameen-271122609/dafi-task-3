import Link from "next/link";

import { Logo } from "@/components/ui/logo";
import { APP_NAME } from "@/lib/constants";

export function SiteFooter() {
  return (
    <footer className="border-t border-ink-200 bg-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-ink-500">
            Appointment scheduling and a shared medical record for independent clinics
            and the patients they look after.
          </p>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-ink-900">Product</h4>
          <ul className="mt-3 space-y-2 text-sm text-ink-500">
            <li>
              <Link href="/#features" className="hover:text-ink-900">
                Features
              </Link>
            </li>
            <li>
              <Link href="/#workflow" className="hover:text-ink-900">
                How it works
              </Link>
            </li>
            <li>
              <Link href="/doctors" className="hover:text-ink-900">
                Doctor directory
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-ink-900">Account</h4>
          <ul className="mt-3 space-y-2 text-sm text-ink-500">
            <li>
              <Link href="/signup" className="hover:text-ink-900">
                Create an account
              </Link>
            </li>
            <li>
              <Link href="/login" className="hover:text-ink-900">
                Sign in
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-ink-100">
        <div className="mx-auto max-w-6xl px-4 py-5 text-xs text-ink-400 sm:px-6">
          © {new Date().getFullYear()} {APP_NAME}. Built for the DevOps internship
          programme.
        </div>
      </div>
    </footer>
  );
}
