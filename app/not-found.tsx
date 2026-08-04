import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center px-4">
      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
          404
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink-900">
          We could not find that page
        </h1>
        <p className="mt-2 text-ink-500">
          The link may be out of date, or the record may no longer be shared with you.
        </p>
        <div className="mt-7 flex justify-center gap-3">
          <Link href="/dashboard" className="btn-primary">
            Go to dashboard
          </Link>
          <Link href="/" className="btn-secondary">
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
