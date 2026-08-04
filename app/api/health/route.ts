import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Liveness probe. PM2 and the Nginx upstream check hit this, so it must stay
 * dependency free and always cheap.
 */
export function GET() {
  return NextResponse.json(
    {
      status: "ok",
      service: "meditrack",
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
