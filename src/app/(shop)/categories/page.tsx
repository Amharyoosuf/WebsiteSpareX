import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "Shop by Category" };
export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      products: {
        where: { isHidden: false },
        orderBy: { createdAt: "desc" },
        select: { images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true } } },
      },
    },
  });

  const cards = categories.map((c) => {
    const count = c.products.length;
    const thumb = c.products.find((p) => p.images[0]?.url)?.images[0]?.url || "/placeholder.svg";
    return { id: c.id, name: c.name, slug: c.slug, count, thumb };
  });

  return (
    <div className="container-page py-6">
      <h1 className="mb-6 text-xl font-bold text-ink sm:text-2xl">Shop by Category</h1>
      {cards.length === 0 ? (
        <div className="card p-10 text-center text-muted">No categories yet.</div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {cards.map((c) => (
            <Link
              key={c.id}
              href={`/category/${c.slug}`}
              className="card group overflow-hidden transition-shadow hover:shadow-pop"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-gray-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={c.thumb}
                  alt={c.name}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/50 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <div className="text-sm font-bold text-white">{c.name}</div>
                  <div className="text-xs text-white/80">{c.count} product{c.count === 1 ? "" : "s"}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
