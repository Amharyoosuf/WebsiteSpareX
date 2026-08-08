import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatLKR } from "@/lib/money";
import { StatusBadge } from "@/components/status-badge";
import { ORDER_STATUSES, ORDER_STATUS_LABELS, PAYMENT_METHODS, type PaymentMethod } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const filter = ORDER_STATUSES.includes(status as never) ? status : undefined;

  const orders = await prisma.order.findMany({
    where: filter ? { status: filter } : undefined,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { _count: { select: { items: true } } },
  });

  const tabs = [{ key: "", label: "All" }, ...ORDER_STATUSES.map((s) => ({ key: s, label: ORDER_STATUS_LABELS[s] }))];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-ink">Orders</h1>

      <div className="mb-4 flex flex-wrap gap-2">
        {tabs.map((t) => {
          const active = (filter || "") === t.key;
          return (
            <Link
              key={t.key || "all"}
              href={t.key ? `/admin/orders?status=${t.key}` : "/admin/orders"}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium ${active ? "bg-brand text-white" : "border border-line bg-white text-ink hover:bg-gray-50"}`}
            >
              {t.label}
            </Link>
          );
        })}
      </div>

      {orders.length === 0 ? (
        <div className="card p-10 text-center text-muted">No orders found.</div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Items</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link href={`/admin/orders/${o.id}`} className="font-semibold text-brand hover:underline">
                      {o.orderNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted">{o.createdAt.toLocaleDateString("en-GB")}</td>
                  <td className="px-4 py-3 text-ink">{o.customerName}</td>
                  <td className="px-4 py-3 text-muted">{o._count.items}</td>
                  <td className="px-4 py-3 text-muted">{PAYMENT_METHODS[o.paymentMethod as PaymentMethod]}</td>
                  <td className="px-4 py-3 font-medium text-ink">{formatLKR(o.total)}</td>
                  <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
