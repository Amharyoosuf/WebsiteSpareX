import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { ProductCard } from "@/components/product-card";

export const metadata: Metadata = { title: "All Products" };
export const dynamic = "force-dynamic";

export default async function AllProductsPage() {
  const products = await prisma.product.findMany({
    where: { isHidden: false },
    orderBy: [{ name: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      isOnOffer: true,
      images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true } },
      variants: { select: { price: true, salePrice: true, inStock: true } },
    },
  });

  return (
    <div className="container-page py-6">
      <div className="mb-6 flex items-end justify-between">
        <h1 className="text-xl font-bold text-ink sm:text-2xl">All Products</h1>
        <span className="text-sm text-muted">{products.length} item{products.length === 1 ? "" : "s"}</span>
      </div>
      {products.length === 0 ? (
        <div className="card p-10 text-center text-muted">No products yet.</div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
