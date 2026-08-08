import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { ProductForm } from "@/components/product-form";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, categories, settings] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        variants: { orderBy: { sortOrder: "asc" } },
      },
    }),
    prisma.category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
    getSettings(),
  ]);

  if (!product) notFound();

  return (
    <div>
      <nav className="mb-4 text-sm text-muted">
        <Link href="/admin/products" className="hover:text-brand">Products</Link>
        <span className="mx-1">/</span>
        <span className="text-ink">{product.name}</span>
      </nav>
      <h1 className="mb-6 text-2xl font-bold text-ink">Edit product</h1>
      <ProductForm
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        aiEnabled={Boolean(settings.openaiApiKey)}
        product={{
          id: product.id,
          name: product.name,
          description: product.description,
          categoryId: product.categoryId,
          isOnOffer: product.isOnOffer,
          seoTitle: product.seoTitle,
          seoDescription: product.seoDescription,
          images: product.images.map((i) => ({ id: i.id, url: i.url })),
          variants: product.variants.map((v) => ({
            id: v.id,
            name: v.name,
            price: v.price,
            salePrice: v.salePrice,
            inStock: v.inStock,
            imageUrl: v.imageUrl,
          })),
        }}
      />
    </div>
  );
}
