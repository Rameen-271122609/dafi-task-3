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

export function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}
