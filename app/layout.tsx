import type { Metadata, Viewport } from "next";

import { APP_NAME, APP_TAGLINE } from "@/lib/constants";
import { siteUrl } from "@/lib/env";

import "./globals.css";

const origin = siteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(origin),
  title: {
    default: `${APP_NAME} — ${APP_TAGLINE}`,
    template: `%s · ${APP_NAME}`,
  },
  description:
    "MediTrack lets clinics publish consulting hours, patients book appointments in seconds, and both sides keep lab reports and prescriptions in one secure record.",
  keywords: [
    "clinic management",
    "appointment booking",
    "medical records",
    "healthcare software",
  ],
  openGraph: {
    type: "website",
    url: origin,
    title: `${APP_NAME} — ${APP_TAGLINE}`,
    description:
      "Book appointments, publish consulting hours and keep every report in one secure medical record.",
    siteName: APP_NAME,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#059666",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
