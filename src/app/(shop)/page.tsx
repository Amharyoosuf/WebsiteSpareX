import { prisma } from "@/lib/db";
import { ProductCard } from "@/components/product-card";
import { Hero } from "@/components/hero";
import { shuffle } from "@/lib/util";

// Rendered on demand so products can be rotated randomly on every visit
// (nothing is fixed by "most recently added").
export const dynamic = "force-dynamic";

const productSelect = {
  id: true,
  name: true,
  slug: true,
  isOnOffer: true,
  images: { orderBy: { sortOrder: "asc" as const }, take: 1, select: { url: true } },
  variants: { select: { price: true, salePrice: true, inStock: true } },
};

export default async function HomePage() {
  // One query, then shuffle in memory so the hero, offers and tiles all rotate.
  const products = await prisma.product.findMany({
    where: { isHidden: false },
    select: productSelect,
    take: 300,
  });
  const shuffled = shuffle(products);

  const heroProducts = shuffled
    .filter((p) => p.images[0]?.url)
    .slice(0, 6)
    .map((p) => ({ slug: p.slug, name: p.name, image: p.images[0]!.url }));

  const onOffer = shuffled.filter((p) => p.isOnOffer).slice(0, 8);
  const tiles = shuffled.slice(0, 30);

  return (
    <div className="container-page py-6">
      <Hero products={heroProducts} />

      {/* On Offer — only shown when something is actually on offer */}
      {onOffer.length > 0 && (
        <section className="mb-10">
          <div className="mb-4 flex items-end justify-between">
            <h2 className="flex items-center gap-2.5 text-lg font-bold text-ink sm:text-xl">
              <span className="h-5 w-1.5 rounded-full bg-gradient-to-b from-offer to-amber-600" />
              On Offer
            </h2>
            <span className="text-sm text-muted">Best deals right now</span>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {onOffer.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Random product mix */}
      <section>
        <div className="mb-4 flex items-end justify-between">
          <h2 className="flex items-center gap-2.5 text-lg font-bold text-ink sm:text-xl">
            <span className="h-5 w-1.5 rounded-full bg-gradient-to-b from-brand to-brand-dark" />
            Explore Products
          </h2>
        </div>
        {tiles.length === 0 ? (
          <div className="card p-10 text-center text-muted">
            No products yet. Add some from the admin panel.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {tiles.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
