"use client";

import Link from "next/link";
import { useCart } from "./cart";
import { formatLKR } from "@/lib/money";

export function CartView({ deliveryFee }: { deliveryFee: number }) {
  const { items, subtotal, setQty, remove, ready } = useCart();

  if (!ready) {
    return <div className="card p-10 text-center text-muted">Loading cart…</div>;
  }

  if (items.length === 0) {
    return (
      <div className="card p-12 text-center">
        <p className="text-muted">Your cart is empty.</p>
        <Link href="/" className="btn-primary mt-4 inline-flex">
          Browse products
        </Link>
      </div>
    );
  }

  const total = subtotal + deliveryFee;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <ul className="card divide-y divide-line">
          {items.map((it) => (
            <li key={it.variantId} className="flex gap-3 p-4">
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-line bg-gray-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={it.image || "/placeholder.svg"}
                  alt={it.productName}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <Link href={`/product/${it.productSlug}`} className="font-semibold text-ink hover:text-brand">
                  {it.productName}
                </Link>
                <p className="text-sm text-muted">Model: {it.variantName}</p>
                <p className="mt-1 text-sm font-medium text-ink">{formatLKR(it.unitPrice)}</p>
                <div className="mt-2 flex items-center gap-3">
                  <div className="inline-flex items-center rounded-lg border border-line">
                    <button
                      className="px-3 py-1.5 text-ink disabled:opacity-40"
                      onClick={() => setQty(it.variantId, it.qty - 1)}
                      disabled={it.qty <= 1}
                      aria-label="Decrease"
                    >
                      −
                    </button>
                    <span className="w-8 text-center text-sm font-semibold">{it.qty}</span>
                    <button
                      className="px-3 py-1.5 text-ink"
                      onClick={() => setQty(it.variantId, it.qty + 1)}
                      aria-label="Increase"
                    >
                      +
                    </button>
                  </div>
                  <button
                    className="text-sm text-red-600 hover:underline"
                    onClick={() => remove(it.variantId)}
                  >
                    Remove
                  </button>
                </div>
              </div>
              <div className="text-right font-semibold text-ink">
                {formatLKR(it.unitPrice * it.qty)}
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="lg:col-span-1">
        <div className="card sticky top-20 p-5">
          <h2 className="text-base font-bold text-ink">Order Summary</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Subtotal</dt>
              <dd className="font-medium text-ink">{formatLKR(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Delivery</dt>
              <dd className="font-medium text-ink">{formatLKR(deliveryFee)}</dd>
            </div>
            <div className="flex justify-between border-t border-line pt-3 text-base">
              <dt className="font-bold text-ink">Total</dt>
              <dd className="font-bold text-ink">{formatLKR(total)}</dd>
            </div>
          </dl>
          <Link href="/checkout" className="btn-primary mt-5 w-full">
            Proceed to Checkout
          </Link>
          <Link href="/" className="btn-ghost mt-2 w-full">
            Continue shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
