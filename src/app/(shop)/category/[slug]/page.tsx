import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { ProductCard } from "@/components/product-card";

export const revalidate = 60;

const productSelect = {
  id: true,
  name: true,
  slug: true,
  isOnOffer: true,
  images: { orderBy: { sortOrder: "asc" as const }, take: 1, select: { url: true } },
  variants: { select: { price: true, salePrice: true, inStock: true } },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await prisma.category.findUnique({ where: { slug } });
  if (!category) return { title: "Category not found" };
  return { title: category.name, description: `${category.name} — spare parts.` };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = await prisma.category.findUnique({
    where: { slug },
    include: {
      products: {
        where: { isHidden: false },
        orderBy: { createdAt: "desc" },
        select: productSelect,
      },
    },
  });

  if (!category) notFound();

  return (
    <div className="container-page py-6">
      <nav className="mb-4 text-sm text-muted">
        <a href="/" className="hover:text-brand">Home</a> <span className="mx-1">/</span>
        <span className="text-ink">{category.name}</span>
      </nav>
      <h1 className="mb-6 text-2xl font-bold text-ink">{category.name}</h1>
      {category.products.length === 0 ? (
        <div className="card p-10 text-center text-muted">No products in this category yet.</div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {category.products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
