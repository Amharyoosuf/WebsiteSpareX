import { prisma } from "@/lib/db";
import { deriveSource } from "@/lib/analytics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TYPES = new Set(["view", "product_view", "add_to_cart"]);

// Public endpoint hit by the storefront tracker (sendBeacon / fetch).
// Must never throw — analytics failures must not affect visitors.
export async function POST(req: Request) {
  try {
    const raw = await req.text();
    const body = raw ? JSON.parse(raw) : {};

    const type = TYPES.has(body?.type) ? body.type : "view";
    const referrer = String(body?.referrer || "");
    const utmSource = String(body?.utmSource || "").slice(0, 60);
    const isEntry = body?.entry !== false;
    const productId = body?.productId ? String(body.productId).slice(0, 60) : null;
    const visitorId = body?.visitorId ? String(body.visitorId).slice(0, 64) : null;
    const path = String(body?.path || "").slice(0, 200);
    const ownHost = req.headers.get("host") || "";

    const { source, referrerHost } = deriveSource(referrer, utmSource, ownHost, isEntry);

    await prisma.analyticsEvent.create({
      data: { type, path, source, referrerHost, productId, visitorId },
    });
  } catch {
    // swallow — never surface tracking errors to visitors
  }
  return new Response(null, { status: 204 });
}
