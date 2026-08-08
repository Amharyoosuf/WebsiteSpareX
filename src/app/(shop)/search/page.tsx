import type { Metadata } from "next";
import { ProductCard } from "@/components/product-card";
import { searchProducts } from "@/lib/search";

export const metadata: Metadata = { title: "Search", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q || "").trim();
  const results = query ? await searchProducts(query) : [];

  return (
    <div className="container-page py-6">
      <h1 className="mb-1 text-xl font-bold text-ink sm:text-2xl">Search</h1>
      {query ? (
        <p className="mb-6 text-sm text-muted">
          {results.length} result{results.length === 1 ? "" : "s"} for “{query}”
        </p>
      ) : (
        <p className="mb-6 text-sm text-muted">Type a part name in the search box above.</p>
      )}

      {query && results.length === 0 ? (
        <div className="card p-10 text-center text-muted">
          No products found. Try a different word.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {results.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
