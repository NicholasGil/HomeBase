import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { getTestSession } from "@/app/actions/test-session";
import { AppProviders } from "@/components/providers";
import {
  COACH_SCROLL_PERSONA_DATA_ATTR,
  coachScrollPersonaKeyForSession,
} from "@/lib/coach-scroll-key";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteDescription =
  "The operating system for buying a home. One buyer, one transaction, from first look through closing.";

export const metadata: Metadata = {
  metadataBase: new URL("https://realtyrise.app"),
  title: "RealtyRise",
  description: siteDescription,
  openGraph: {
    title: "RealtyRise",
    description: siteDescription,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const session = await getTestSession();
  const coachScrollPersona = coachScrollPersonaKeyForSession(session);

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      {...{ [COACH_SCROLL_PERSONA_DATA_ATTR]: coachScrollPersona }}
    >
      <body className="min-h-full flex flex-col">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
