import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { formatLKR } from "@/lib/money";
import { PAYMENT_METHODS, type PaymentMethod } from "@/lib/constants";

export const metadata: Metadata = { title: "Order Confirmation", robots: { index: false } };

export default async function OrderPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;
  const [order, settings] = await Promise.all([
    prisma.order.findUnique({ where: { orderNumber }, include: { items: true } }),
    getSettings(),
  ]);
  if (!order) notFound();

  const isBank = order.paymentMethod === "BANK_DEPOSIT";

  return (
    <div className="container-page py-8">
      <div className="mx-auto max-w-2xl">
        <div className="card p-6 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-green-100 text-green-700">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <h1 className="mt-4 text-2xl font-bold text-ink">Thank you for your order!</h1>
          <p className="mt-1 text-muted">
            Order <span className="font-semibold text-ink">{order.orderNumber}</span> has been received.
          </p>
          <p className="mt-1 text-sm text-muted">We’ll call you on {order.phone1} to confirm delivery.</p>
        </div>

        <div className="card mt-4 p-5">
          <h2 className="mb-3 text-base font-bold text-ink">Order Summary</h2>
          <ul className="divide-y divide-line">
            {order.items.map((it) => (
              <li key={it.id} className="flex justify-between gap-2 py-2 text-sm">
                <span className="text-ink">
                  {it.productName} <span className="text-muted">({it.variantName})</span> × {it.qty}
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
        </div>

        <div className="card mt-4 p-5">
          <h2 className="mb-3 text-base font-bold text-ink">Delivery & Payment</h2>
          <dl className="grid gap-1.5 text-sm">
            <Row k="Name" v={order.customerName} />
            <Row k="Address" v={order.address} />
            <Row k="Phone" v={order.phone2 ? `${order.phone1}, ${order.phone2}` : order.phone1} />
            <Row k="Payment" v={PAYMENT_METHODS[order.paymentMethod as PaymentMethod]} />
          </dl>

          {isBank && (
            <div className="mt-4 rounded-lg border border-line bg-gray-50 p-4 text-sm">
              <p className="font-semibold text-ink">Please deposit {formatLKR(order.total)} to:</p>
              <dl className="mt-2 grid gap-1">
                {settings.bankName && <Row k="Bank" v={settings.bankName} />}
                {settings.bankAccountName && <Row k="Account Name" v={settings.bankAccountName} />}
                {settings.bankAccountNumber && <Row k="Account No." v={settings.bankAccountNumber} />}
                {settings.bankBranch && <Row k="Branch" v={settings.bankBranch} />}
              </dl>
              {order.depositSlipUrl ? (
                <p className="mt-3 text-green-700">✓ Deposit slip received.</p>
              ) : (
                <p className="mt-3 text-muted">
                  After depositing, send us your slip{settings.phone1 ? ` on ${settings.phone1}` : ""}.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="mt-6 text-center">
          <Link href="/" className="btn-primary">Continue shopping</Link>
        </div>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted">{k}</dt>
      <dd className="text-right font-medium text-ink">{v}</dd>
    </div>
  );
}
