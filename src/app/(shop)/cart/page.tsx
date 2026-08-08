import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";
import { CartView } from "@/components/cart-view";

export const metadata: Metadata = { title: "Cart" };
export const dynamic = "force-dynamic";

export default async function CartPage() {
  const settings = await getSettings();
  return (
    <div className="container-page py-6">
      <h1 className="mb-6 text-2xl font-bold text-ink">Your Cart</h1>
      <CartView deliveryFee={settings.deliveryFee} />
    </div>
  );
}
