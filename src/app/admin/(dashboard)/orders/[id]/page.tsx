import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatLKR } from "@/lib/money";
import { StatusBadge } from "@/components/status-badge";
import { ORDER_STATUSES, ORDER_STATUS_LABELS, PAYMENT_METHODS, type PaymentMethod } from "@/lib/constants";
import { updateOrderStatus } from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminOrderDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await prisma.order.findUnique({ where: { id }, include: { items: true } });
  if (!order) notFound();

  const isBank = order.paymentMethod === "BANK_DEPOSIT";

  return (
    <div>
      <nav className="mb-4 text-sm text-muted">
        <Link href="/admin/orders" className="hover:text-brand">Orders</Link>
        <span className="mx-1">/</span>
        <span className="text-ink">{order.orderNumber}</span>
      </nav>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">{order.orderNumber}</h1>
          <p className="text-sm text-muted">{order.createdAt.toLocaleString("en-GB")}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="card p-5">
            <h2 className="mb-3 text-base font-bold text-ink">Items</h2>
            <ul className="divide-y divide-line">
              {order.items.map((it) => (
                <li key={it.id} className="flex justify-between gap-2 py-2 text-sm">
                  <span className="text-ink">
                    {it.productName} <span className="text-muted">({it.variantName})</span>
                    <span className="text-muted"> × {it.qty}</span>
                  </span>
                  <span className="font-medium text-ink">{formatLKR(it.lineTotal)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-3 space-y-1.5 border-t border-line pt-3 text-sm">
              <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{formatLKR(order.subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Delivery</dt><dd>{formatLKR(order.deliveryFee)}</dd></div>
              <div className="flex justify-between border-t border-line pt-2 text-base font-bold"><dt>Total</dt><dd>{formatLKR(order.total)}</dd></div>
            </dl>
          </section>

          {isBank && (
            <section className="card p-5">
              <h2 className="mb-3 text-base font-bold text-ink">Bank Deposit Slip</h2>
              {order.depositSlipUrl ? (
                <div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={order.depositSlipUrl} alt="Deposit slip" className="max-h-96 rounded-lg border border-line" />
                  <a href={order.depositSlipUrl} target="_blank" className="mt-2 inline-block text-sm text-brand hover:underline">
                    Open full size ↗
                  </a>
                </div>
              ) : (
                <p className="text-sm text-muted">No slip uploaded yet.</p>
              )}
            </section>
          )}
        </div>

        <div className="space-y-6 lg:col-span-1">
          <section className="card p-5">
            <h2 className="mb-3 text-base font-bold text-ink">Customer</h2>
            <dl className="grid gap-1.5 text-sm">
              <Row k="Name" v={order.customerName} />
              <Row k="Phone" v={order.phone1} />
              {order.phone2 && <Row k="Phone 2" v={order.phone2} />}
              <div className="pt-1">
                <dt className="text-muted">Address</dt>
                <dd className="mt-0.5 whitespace-pre-line font-medium text-ink">{order.address}</dd>
              </div>
              <Row k="Payment" v={PAYMENT_METHODS[order.paymentMethod as PaymentMethod]} />
            </dl>
          </section>

          <section className="card p-5">
            <h2 className="mb-3 text-base font-bold text-ink">Update status</h2>
            <form action={updateOrderStatus} className="flex gap-2">
              <input type="hidden" name="id" value={order.id} />
              <select name="status" defaultValue={order.status} className="input">
                {ORDER_STATUSES.map((s) => (
                  <option key={s} value={s}>{ORDER_STATUS_LABELS[s]}</option>
                ))}
              </select>
              <button type="submit" className="btn-primary">Save</button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted">{k}</dt>
      <dd className="text-right font-medium text-ink">{v}</dd>
    </div>
  );
}
