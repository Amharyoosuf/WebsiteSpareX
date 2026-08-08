import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatLKR } from "@/lib/money";
import { priceSummary } from "@/lib/products";
import { ConfirmSubmit } from "@/components/confirm-submit";
import { deleteProduct, toggleOffer, toggleHidden } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      category: true,
      images: { orderBy: { sortOrder: "asc" }, take: 1 },
      variants: true,
    },
  });

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold text-ink sm:text-2xl">Products</h1>
        <div className="flex gap-2">
          <Link href="/admin/products/import" className="btn-outline flex-1 sm:flex-none">Import CSV</Link>
          <Link href="/admin/products/new" className="btn-primary flex-1 sm:flex-none">+ Add product</Link>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="card p-10 text-center text-muted">
          No products yet. <Link href="/admin/products/new" className="text-brand hover:underline">Add your first product</Link>.
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Models</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Offer</th>
                <th className="px-4 py-3">Visible</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {products.map((p) => {
                const { min, max, hasRange, anyInStock } = priceSummary(p.variants);
                return (
                  <tr key={p.id} className={`hover:bg-gray-50 ${p.isHidden ? "opacity-60" : ""}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.images[0]?.url || "/placeholder.svg"} alt="" className="h-10 w-10 rounded border border-line object-cover" />
                        <span className="font-medium text-ink">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted">{p.category?.name || "—"}</td>
                    <td className="px-4 py-3 text-muted">{p.variants.length}</td>
                    <td className="px-4 py-3 text-ink">
                      {hasRange ? `${formatLKR(min)} – ${formatLKR(max)}` : formatLKR(min)}
                    </td>
                    <td className="px-4 py-3">
                      {anyInStock ? (
                        <span className="badge bg-green-100 text-green-800">In stock</span>
                      ) : (
                        <span className="badge bg-gray-200 text-gray-700">Out</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <form action={toggleOffer}>
                        <input type="hidden" name="id" value={p.id} />
                        <input type="hidden" name="next" value={(!p.isOnOffer).toString()} />
                        <button type="submit" className={`badge ${p.isOnOffer ? "bg-brand text-white" : "bg-gray-100 text-gray-600"}`}>
                          {p.isOnOffer ? "On" : "Off"}
                        </button>
                      </form>
                    </td>
                    <td className="px-4 py-3">
                      <form action={toggleHidden}>
                        <input type="hidden" name="id" value={p.id} />
                        <input type="hidden" name="next" value={(!p.isHidden).toString()} />
                        <button type="submit" className={`badge ${p.isHidden ? "bg-gray-200 text-gray-600" : "bg-green-100 text-green-800"}`}>
                          {p.isHidden ? "Hidden" : "Shown"}
                        </button>
                      </form>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-3">
                        <Link href={`/admin/products/${p.id}`} className="text-brand hover:underline">Edit</Link>
                        <form action={deleteProduct}>
                          <input type="hidden" name="id" value={p.id} />
                          <ConfirmSubmit message="Delete this product? This cannot be undone." className="text-red-600 hover:underline">
                            Delete
                          </ConfirmSubmit>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
