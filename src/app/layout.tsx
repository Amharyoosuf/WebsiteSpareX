import type { Metadata } from "next";
import "./globals.css";

// Static metadata (no DB access) so the production build never needs a database.
// Per-page titles are set by the individual pages.
function siteUrl(): URL {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3005";
  // Never let a malformed NEXT_PUBLIC_SITE_URL crash the whole site.
  try {
    return new URL(raw);
  } catch {
    try {
      return new URL(`https://${raw.replace(/^https?:\/\//, "")}`);
    } catch {
      return new URL("http://localhost:3005");
    }
  }
}

export const metadata: Metadata = {
  metadataBase: siteUrl(),
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
