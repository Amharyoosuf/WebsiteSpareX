import type { Metadata } from "next";
import "./globals.css";

// Static metadata (no DB access) so the production build never needs a database.
// Per-page titles are set by the individual pages.
const SITE = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3005";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: "SpareX — Spare Parts", template: "%s | SpareX" },
  description:
    "Quality spare parts delivered across Sri Lanka. Fan motors, capacitors, pump parts and more.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white">{children}</body>
    </html>
  );
}
