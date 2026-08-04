/**
 * Supabase renamed the browser-safe key from "anon" to "publishable". New
 * projects only issue the latter, older ones only the former, so both names
 * are accepted and the newer one wins.
 *
 * Next.js inlines `process.env.NEXT_PUBLIC_*` at build time by matching the
 * literal expression, so both must be spelled out rather than looked up
 * dynamically.
 */
export function supabasePublishableKey() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    ""
  );
}

export function supabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
}

/**
 * The build step runs without secrets in CI, so anything that touches Supabase
 * during rendering checks this first and degrades to a static fallback.
 */
export function isSupabaseConfigured() {
  return Boolean(supabaseUrl() && supabasePublishableKey());
}

/**
 * Absolute origin the app is served from, used for metadata and the links
 * Supabase puts in confirmation emails. On EC2 this comes from .env; on
 * Vercel the platform injects the production hostname, so neither host needs
 * the value hard coded.
 */
export function siteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;

  const vercelHost = process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL;
  if (vercelHost) return `https://${vercelHost}`;

  return "http://localhost:3000";
}
