import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";

// Built on demand so it can query the database at runtime (and never at build).
export const dynamic = "force-dynamic";

function baseUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3005").replace(/\/$/, "");
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = baseUrl();
  const entries: MetadataRoute.Sitemap = [{ url: base, changeFrequency: "daily", priority: 1 }];

  try {
    const [products, categories] = await Promise.all([
      prisma.product.findMany({ where: { isHidden: false }, select: { slug: true, updatedAt: true } }),
      prisma.category.findMany({ select: { slug: true } }),
    ]);
    for (const c of categories) {
      entries.push({ url: `${base}/category/${c.slug}`, changeFrequency: "weekly", priority: 0.7 });
    }
    for (const p of products) {
      entries.push({
        url: `${base}/product/${p.slug}`,
        lastModified: p.updatedAt,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
  } catch {
    // Database not available (e.g. during build) — return just the homepage.
  }

  return entries;
}
