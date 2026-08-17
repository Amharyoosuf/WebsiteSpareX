"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "./cart";
import { formatLKR } from "@/lib/money";
import { createOrder } from "@/app/(shop)/checkout/actions";

type BankDetails = {
  bankName: string;
  bankAccountName: string;
  bankAccountNumber: string;
  bankBranch: string;
};

export function CheckoutForm({
  deliveryFee,
  bank,
}: {
  deliveryFee: number;
  bank: BankDetails;
}) {
  const { items, subtotal, clear, ready } = useCart();
  const router = useRouter();
  const [method, setMethod] = useState<"COD" | "BANK_DEPOSIT">("COD");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If cart empties (and not mid-submit), send back to cart page.
  useEffect(() => {
    if (ready && items.length === 0 && !submitting) {
      router.replace("/cart");
    }
  }, [ready, items.length, submitting, router]);

  const total = subtotal + deliveryFee;
  const hasBank = bank.bankAccountNumber || bank.bankName;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const form = e.currentTarget;
    const fd = new FormData(form);
    fd.set("items", JSON.stringify(items.map((i) => ({ variantId: i.variantId, qty: i.qty }))));
    try {
      const res = await createOrder(fd);
      if (res.ok) {
        clear();
        router.push(`/order/${res.orderNumber}`);
      } else {
        setError(res.error);
        setSubmitting(false);
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  if (!ready) return <div className="card p-10 text-center text-muted">Loading…</div>;
  if (items.length === 0) return null;

  return (
    <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        {/* Delivery details */}
        <section className="card p-5">
          <h2 className="mb-4 text-base font-bold text-ink">Delivery Details</h2>
          <div className="grid gap-4">
            <div>
              <label className="label" htmlFor="customerName">Full name *</label>
              <input id="customerName" name="customerName" className="input" required autoComplete="name" />
            </div>
            <div>
              <label className="label" htmlFor="address">Delivery address *</label>
              <textarea id="address" name="address" rows={3} className="input" required />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="phone1">Phone number *</label>
                <input id="phone1" name="phone1" className="input" required inputMode="tel" autoComplete="tel" />
              </div>
              <div>
                <label className="label" htmlFor="phone2">Second phone (optional)</label>
                <input id="phone2" name="phone2" className="input" inputMode="tel" />
              </div>
            </div>
          </div>
        </section>

        {/* Payment */}
        <section className="card p-5">
          <h2 className="mb-4 text-base font-bold text-ink">Payment Method</h2>
          <div className="grid gap-3">
            <label className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 ${method === "COD" ? "border-brand bg-brand-light" : "border-line"}`}>
              <input
                type="radio"
                name="paymentMethod"
                value="COD"
                checked={method === "COD"}
                onChange={() => setMethod("COD")}
                className="mt-1"
              />
              <div>
                <div className="font-semibold text-ink">Cash on Delivery</div>
                <div className="text-sm text-muted">Pay in cash when your order arrives.</div>
              </div>
            </label>

            <label className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 ${method === "BANK_DEPOSIT" ? "border-brand bg-brand-light" : "border-line"}`}>
              <input
                type="radio"
                name="paymentMethod"
                value="BANK_DEPOSIT"
                checked={method === "BANK_DEPOSIT"}
                onChange={() => setMethod("BANK_DEPOSIT")}
                className="mt-1"
              />
              <div>
                <div className="font-semibold text-ink">Bank Deposit</div>
                <div className="text-sm text-muted">Deposit to our account and upload the slip.</div>
              </div>
            </label>
          </div>

          {method === "BANK_DEPOSIT" && (
            <div className="mt-4 rounded-lg border border-line bg-gray-50 p-4">
              {hasBank ? (
                <dl className="grid gap-1 text-sm">
                  {bank.bankName && <Row k="Bank" v={bank.bankName} />}
                  {bank.bankAccountName && <Row k="Account Name" v={bank.bankAccountName} />}
                  {bank.bankAccountNumber && <Row k="Account No." v={bank.bankAccountNumber} />}
                  {bank.bankBranch && <Row k="Branch" v={bank.bankBranch} />}
                </dl>
              ) : (
                <p className="text-sm text-muted">
                  Bank details will be shared by the shop. You can upload your slip below.
                </p>
              )}
              <div className="mt-4">
                <label className="label" htmlFor="slip">Upload deposit slip (optional)</label>
                <input
                  id="slip"
                  name="slip"
                  type="file"
                  accept="image/*,application/pdf"
                  className="block w-full text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-brand file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-brand-dark"
                />
                <p className="mt-1 text-xs text-muted">You can also send it later — we’ll confirm once payment is received.</p>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Summary */}
      <div className="lg:col-span-1">
        <div className="card sticky top-20 p-5">
          <h2 className="text-base font-bold text-ink">Order Summary</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {items.map((it) => (
              <li key={it.variantId} className="flex justify-between gap-2">
                <span className="text-muted">
                  {it.productName}
                  {it.variantName && <span className="text-gray-400"> ({it.variantName})</span>} × {it.qty}
                </span>
                <span className="font-medium text-ink">{formatLKR(it.unitPrice * it.qty)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-2 border-t border-line pt-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Subtotal</dt>
              <dd className="font-medium text-ink">{formatLKR(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Delivery</dt>
              <dd className="font-medium text-ink">{formatLKR(deliveryFee)}</dd>
            </div>
            <div className="flex justify-between border-t border-line pt-2 text-base">
              <dt className="font-bold text-ink">Total</dt>
              <dd className="font-bold text-ink">{formatLKR(total)}</dd>
            </div>
          </dl>

          {error && (
            <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <button type="submit" className="btn-primary mt-5 w-full" disabled={submitting}>
            {submitting ? "Placing order…" : "Place Order"}
          </button>
          <Link href="/cart" className="btn-ghost mt-2 w-full">
            Back to cart
          </Link>
        </div>
      </div>
    </form>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted">{k}</dt>
      <dd className="font-semibold text-ink">{v}</dd>
    </div>
  );
}
