import type { NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Every path except static assets, image optimisation output, common
     * file extensions served straight from disk, and `/api`.
     *
     * Route handlers are excluded on purpose: this middleware exists to
     * refresh the session cookie and redirect anonymous *page* traffic to
     * the sign-in screen. Applying that to `/api/health` turned the probe
     * PM2 and Nginx depend on into a 307 towards /login.
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
