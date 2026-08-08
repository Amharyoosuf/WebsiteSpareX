import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { ProductForm } from "@/components/product-form";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const [categories, settings] = await Promise.all([
    prisma.category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
    getSettings(),
  ]);

  return (
    <div>
      <nav className="mb-4 text-sm text-muted">
        <Link href="/admin/products" className="hover:text-brand">Products</Link>
        <span className="mx-1">/</span>
        <span className="text-ink">New</span>
      </nav>
      <h1 className="mb-6 text-2xl font-bold text-ink">Add product</h1>
      <ProductForm
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        aiEnabled={Boolean(settings.openaiApiKey)}
      />
    </div>
  );
}
