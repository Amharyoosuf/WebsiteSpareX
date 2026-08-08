import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";
import { CheckoutForm } from "@/components/checkout-form";

export const metadata: Metadata = { title: "Checkout" };
export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const s = await getSettings();
  return (
    <div className="container-page py-6">
      <h1 className="mb-6 text-2xl font-bold text-ink">Checkout</h1>
      <CheckoutForm
        deliveryFee={s.deliveryFee}
        bank={{
          bankName: s.bankName,
          bankAccountName: s.bankAccountName,
          bankAccountNumber: s.bankAccountNumber,
          bankBranch: s.bankBranch,
        }}
      />
    </div>
  );
}
