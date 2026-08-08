import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatLKR } from "@/lib/money";
import { StatusBadge } from "@/components/status-badge";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [orderCount, pending, delivered, productCount, categoryCount, recent, revenue] =
    await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: "PENDING" } }),
      prisma.order.count({ where: { status: "DELIVERED" } }),
      prisma.product.count(),
      prisma.category.count(),
      prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 6 }),
      prisma.order.aggregate({ _sum: { total: true }, where: { status: "DELIVERED" } }),
    ]);

  const stats = [
    { label: "Total orders", value: orderCount },
    { label: "Pending", value: pending },
    { label: "Delivered", value: delivered },
    { label: "Products", value: productCount },
    { label: "Categories", value: categoryCount },
    { label: "Delivered revenue", value: formatLKR(revenue._sum.total || 0) },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink">Dashboard</h1>
        <Link href="/admin/products/new" className="btn-primary">+ Add product</Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((s) => (
          <div key={s.label} className="card p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-muted">{s.label}</div>
            <div className="mt-1 text-xl font-bold text-ink">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink">Recent orders</h2>
          <Link href="/admin/orders" className="text-sm font-medium text-brand hover:underline">
            View all →
          </Link>
        </div>
        {recent.length === 0 ? (
          <div className="card p-8 text-center text-muted">No orders yet.</div>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {recent.map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link href={`/admin/orders/${o.id}`} className="font-semibold text-brand hover:underline">
                        {o.orderNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-ink">{o.customerName}</td>
                    <td className="px-4 py-3 font-medium text-ink">{formatLKR(o.total)}</td>
                    <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
