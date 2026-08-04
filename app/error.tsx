"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surfaces in the PM2 log so a failing page can be traced on the server.
    console.error("Unhandled application error", error);
  }, [error]);

  return (
    <div className="grid min-h-dvh place-items-center px-4">
      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-red-600">
          Something went wrong
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink-900">
          That page could not be loaded
        </h1>
        <p className="mt-2 text-ink-500">
          The problem has been logged. Try again, or head back to your dashboard.
        </p>
        {error.digest ? (
          <p className="mt-3 font-mono text-xs text-ink-400">
            Reference: {error.digest}
          </p>
        ) : null}
        <div className="mt-7 flex justify-center gap-3">
          <button type="button" onClick={reset} className="btn-primary">
            Try again
          </button>
          <Link href="/dashboard" className="btn-secondary">
            Go to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
