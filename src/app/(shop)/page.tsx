import { prisma } from "@/lib/db";
import { ProductCard } from "@/components/product-card";

// Rendered on demand (SQLite queries are instant) so the production build
// never needs a database connection.
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
  const [onOffer, all] = await Promise.all([
    prisma.product.findMany({
      where: { isOnOffer: true, isHidden: false },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: productSelect,
    }),
    prisma.product.findMany({
      where: { isHidden: false },
      orderBy: { createdAt: "desc" },
      take: 48,
      select: productSelect,
    }),
  ]);

  return (
    <div className="container-page py-6">
      {/* Hero — heading only */}
      <section className="mb-8 overflow-hidden rounded-xl border border-line bg-gradient-to-br from-brand-light to-white p-6 sm:p-10">
        <h1 className="max-w-3xl text-2xl font-extrabold tracking-tight text-ink sm:text-4xl">
          Genuine spare parts, delivered to your door.
        </h1>
      </section>

      {/* On Offer */}
      {onOffer.length > 0 && (
        <section className="mb-10">
          <div className="mb-4 flex items-end justify-between">
            <h2 className="text-lg font-bold text-ink sm:text-xl">On Offer</h2>
            <span className="text-sm text-muted">Best deals right now</span>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {onOffer.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* All products */}
      <section>
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-lg font-bold text-ink sm:text-xl">All Products</h2>
        </div>
        {all.length === 0 ? (
          <div className="card p-10 text-center text-muted">
            No products yet. Add some from the admin panel.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {all.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
