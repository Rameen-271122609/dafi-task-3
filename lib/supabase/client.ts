import { createBrowserClient } from "@supabase/ssr";

import { supabasePublishableKey, supabaseUrl } from "@/lib/env";
import type { Database } from "@/lib/types/database";

/**
 * Supabase client for use inside client components. Reads the browser-safe
 * publishable key, so every query is still constrained by row level security.
 */
export function createClient() {
  return createBrowserClient<Database>(
    supabaseUrl(),
    supabasePublishableKey()
  );
}
