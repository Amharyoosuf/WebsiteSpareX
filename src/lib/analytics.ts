// Map a referrer / UTM into a friendly traffic source. Pure + server-safe.

const KNOWN: { match: RegExp; label: string }[] = [
  { match: /(^|\.)google\./i, label: "Google" },
  { match: /(^|\.)bing\./i, label: "Bing" },
  { match: /duckduckgo\./i, label: "DuckDuckGo" },
  { match: /(^|\.)(facebook|fb)\.(com|me)/i, label: "Facebook" },
  { match: /l\.facebook\.com/i, label: "Facebook" },
  { match: /instagram\./i, label: "Instagram" },
  { match: /(^|\.)(t\.co|twitter\.com|x\.com)/i, label: "X / Twitter" },
  { match: /(whatsapp\.com|wa\.me)/i, label: "WhatsApp" },
  { match: /(tiktok\.com)/i, label: "TikTok" },
  { match: /(youtube\.com|youtu\.be)/i, label: "YouTube" },
  { match: /(t\.me|telegram\.)/i, label: "Telegram" },
  { match: /(^|\.)linkedin\./i, label: "LinkedIn" },
  { match: /(^|\.)pinterest\./i, label: "Pinterest" },
];

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./i, "");
  } catch {
    return "";
  }
}

export function deriveSource(
  referrer: string,
  utmSource: string,
  ownHost: string,
  isEntry: boolean
): { source: string; referrerHost: string } {
  const refHost = hostOf(referrer);

  // Non-entry page views within the same session are internal navigation.
  if (!isEntry) return { source: "Internal", referrerHost: refHost };

  const utm = (utmSource || "").trim();
  if (utm) {
    const label = utm.charAt(0).toUpperCase() + utm.slice(1);
    return { source: label, referrerHost: refHost };
  }

  if (!referrer || !refHost) return { source: "Direct", referrerHost: "" };

  const own = (ownHost || "").replace(/^www\./i, "").toLowerCase();
  if (own && refHost.toLowerCase() === own) return { source: "Internal", referrerHost: refHost };

  for (const k of KNOWN) {
    if (k.match.test(refHost)) return { source: k.label, referrerHost: refHost };
  }
  return { source: refHost, referrerHost: refHost };
}

export function pct(numerator: number, denominator: number): string {
  if (!denominator) return "0%";
  return `${Math.round((numerator / denominator) * 1000) / 10}%`;
}
