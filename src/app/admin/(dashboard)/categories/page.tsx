import { prisma } from "@/lib/db";
import { createCategory, updateCategory, deleteCategory } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { products: true } } },
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-ink">Categories</h1>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Add new */}
        <div className="lg:col-span-1">
          <form action={createCategory} className="card p-5">
            <h2 className="mb-3 text-base font-bold text-ink">Add category</h2>
            <div className="mb-3">
              <label className="label" htmlFor="name">Name</label>
              <input id="name" name="name" className="input" required placeholder="e.g. Fan Spares" />
            </div>
            <div className="mb-4">
              <label className="label" htmlFor="sortOrder">Sort order</label>
              <input id="sortOrder" name="sortOrder" type="number" className="input" defaultValue={0} />
            </div>
            <button type="submit" className="btn-primary w-full">Add category</button>
          </form>
        </div>

        {/* List / edit */}
        <div className="lg:col-span-2">
          <div className="card divide-y divide-line">
            {categories.length === 0 && (
              <p className="p-6 text-center text-muted">No categories yet.</p>
            )}
            {categories.map((c) => (
              <div key={c.id} className="p-4">
                <form action={updateCategory} className="flex flex-wrap items-end gap-3">
                  <input type="hidden" name="id" value={c.id} />
                  <div className="flex-1">
                    <label className="label">Name</label>
                    <input name="name" className="input" defaultValue={c.name} />
                  </div>
                  <div className="w-24">
                    <label className="label">Order</label>
                    <input name="sortOrder" type="number" className="input" defaultValue={c.sortOrder} />
                  </div>
                  <button type="submit" className="btn-outline">Save</button>
                </form>
                <div className="mt-2 flex items-center justify-between text-xs text-muted">
                  <span>/{c.slug} · {c._count.products} product{c._count.products === 1 ? "" : "s"}</span>
                  <form action={deleteCategory}>
                    <input type="hidden" name="id" value={c.id} />
                    <button type="submit" className="text-red-600 hover:underline">Delete</button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
