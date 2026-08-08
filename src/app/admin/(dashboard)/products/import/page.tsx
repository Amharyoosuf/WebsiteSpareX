import Link from "next/link";
import { getSettings } from "@/lib/settings";
import { ImportClient } from "@/components/import-client";

export const dynamic = "force-dynamic";

export default async function ImportProductsPage() {
  const settings = await getSettings();
  return (
    <div>
      <nav className="mb-4 text-sm text-muted">
        <Link href="/admin/products" className="hover:text-brand">Products</Link>
        <span className="mx-1">/</span>
        <span className="text-ink">Import CSV</span>
      </nav>
      <h1 className="mb-1 text-2xl font-bold text-ink">Import products from CSV</h1>
      <p className="mb-6 text-sm text-muted">
        Columns: <code className="rounded bg-gray-100 px-1">main_product, model, price, sale_price, category, description, in_stock, image_url</code>
      </p>
      <ImportClient aiEnabled={Boolean(settings.openaiApiKey)} />
    </div>
  );
}
