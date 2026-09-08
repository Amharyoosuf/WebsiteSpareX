import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { ProductDetail } from "@/components/product-detail";
import { ProductViewTracker } from "@/components/tracker";
import { priceSummary } from "@/lib/products";

export const revalidate = 60;

async function getProduct(slug: string) {
  return prisma.product.findUnique({
    where: { slug },
    include: {
      category: true,
      images: { orderBy: { sortOrder: "asc" } },
      variants: { orderBy: { sortOrder: "asc" } },
    },
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { title: "Product not found" };
  const title = product.seoTitle || product.name;
  const description =
    product.seoDescription || product.description?.slice(0, 155) || `${product.name} — spare parts.`;
  const image = product.images[0]?.url;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: image ? [{ url: image }] : undefined,
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product || product.isHidden) notFound();

  const { min } = priceSummary(product.variants);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || undefined,
    image: product.images.map((i) => i.url),
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "LKR",
      lowPrice: min,
      offerCount: product.variants.length,
      availability: product.variants.some((v) => v.inStock)
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
  };

  return (
    <div className="container-page py-6">
      <ProductViewTracker productId={product.id} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <nav className="mb-6 text-sm text-muted">
        <Link href="/" className="hover:text-brand">Home</Link> <span className="mx-1">/</span>
        {product.category && (
          <>
            <Link href={`/category/${product.category.slug}`} className="hover:text-brand">
              {product.category.name}
            </Link>{" "}
            <span className="mx-1">/</span>
          </>
        )}
        <span className="text-ink">{product.name}</span>
      </nav>

      <ProductDetail
        product={{
          id: product.id,
          name: product.name,
          slug: product.slug,
          description: product.description,
          images: product.images.map((i) => ({ url: i.url })),
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
