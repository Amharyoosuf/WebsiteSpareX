import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";

// llms.txt — a concise, LLM-friendly map of the site (see llmstxt.org).
// Served at /llms.txt. Built on demand so it reflects the live catalogue.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function baseUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3005").replace(/\/$/, "");
}

export async function GET() {
  const base = baseUrl();
  let body = "";

  try {
    const [settings, categories, products] = await Promise.all([
      getSettings(),
      prisma.category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
      prisma.product.findMany({
        where: { isHidden: false },
        orderBy: { name: "asc" },
        take: 500,
        select: { name: true, slug: true },
      }),
    ]);

    const name = settings.shopName || "Ceylon Spares";
    const L: string[] = [];

    L.push(`# ${name}`);
    L.push("");
    L.push(
      `> ${name} is an online spare-parts shop in Sri Lanka. We sell fan motors, ` +
        `capacitors, pump parts, electrical spares and more. Flat Rs ${settings.deliveryFee} ` +
        `delivery island-wide; pay by Cash on Delivery or Bank Deposit. Checkout is guest — ` +
        `no account needed.`
    );
    L.push("");

    L.push("## Main pages");
    L.push(`- [Home](${base}/): Featured and on-offer products`);
    L.push(`- [All products](${base}/products): The full catalogue`);
    L.push(`- [Shop by category](${base}/categories): Browse product categories`);
    L.push(`- [Search](${base}/search): Find a part by name`);
    L.push("");

    if (categories.length) {
      L.push("## Categories");
      for (const c of categories) L.push(`- [${c.name}](${base}/category/${c.slug})`);
      L.push("");
    }

    if (products.length) {
      L.push("## Products");
      for (const p of products) L.push(`- [${p.name}](${base}/product/${p.slug})`);
      L.push("");
    }

    L.push("## Contact");
    L.push("- WhatsApp: +94 78 381 1311");
    if (settings.phone1) L.push(`- Phone: ${settings.phone1}${settings.phone2 ? `, ${settings.phone2}` : ""}`);
    if (settings.email) L.push(`- Email: ${settings.email}`);
    if (settings.shopAddress) L.push(`- Address: ${settings.shopAddress}`);
    L.push("");

    L.push("## Notes");
    L.push("- Prices are in Sri Lankan Rupees (LKR).");
    L.push(`- Delivery is a flat Rs ${settings.deliveryFee}, island-wide.`);
    L.push("- Payment methods: Cash on Delivery, or Bank Deposit with slip upload.");
    L.push("");

    body = L.join("\n");
  } catch {
    body = `# Ceylon Spares\n\n> Online spare-parts shop in Sri Lanka.\n\n- [All products](${base}/products)\n`;
  }

  return new Response(body, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}
