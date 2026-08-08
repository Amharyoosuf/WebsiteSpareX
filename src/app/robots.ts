import type { MetadataRoute } from "next";

function baseUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3005").replace(/\/$/, "");
}

export default function robots(): MetadataRoute.Robots {
  const base = baseUrl();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/checkout", "/cart", "/order"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
