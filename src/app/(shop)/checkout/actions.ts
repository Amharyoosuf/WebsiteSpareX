"use server";

import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { uploadFormFile, isUploadedFile } from "@/lib/storage";
import { orderNumber as makeOrderNumber } from "@/lib/util";
import { effectivePrice } from "@/lib/products";
import type { PaymentMethod } from "@/lib/constants";

type IncomingItem = { variantId: string; qty: number };

export type CheckoutResult =
  | { ok: true; orderNumber: string }
  | { ok: false; error: string };

export async function createOrder(formData: FormData): Promise<CheckoutResult> {
  const customerName = String(formData.get("customerName") || "").trim();
  const address = String(formData.get("address") || "").trim();
  const phone1 = String(formData.get("phone1") || "").trim();
  const phone2 = String(formData.get("phone2") || "").trim();
  const paymentMethod = String(formData.get("paymentMethod") || "") as PaymentMethod;
  const itemsRaw = String(formData.get("items") || "[]");

  if (!customerName || !address || !phone1) {
    return { ok: false, error: "Please fill in your name, address, and phone number." };
  }
  if (paymentMethod !== "COD" && paymentMethod !== "BANK_DEPOSIT") {
    return { ok: false, error: "Please choose a payment method." };
  }

  let incoming: IncomingItem[];
  try {
    incoming = JSON.parse(itemsRaw);
  } catch {
    return { ok: false, error: "Your cart could not be read. Please try again." };
  }
  if (!Array.isArray(incoming) || incoming.length === 0) {
    return { ok: false, error: "Your cart is empty." };
  }

  // Recompute everything from the database — never trust client prices.
  const variantIds = incoming.map((i) => i.variantId);
  const variants = await prisma.productVariant.findMany({
    where: { id: { in: variantIds } },
    include: { product: true },
  });
  const byId = new Map(variants.map((v) => [v.id, v]));

  const orderItems: {
    productId: string;
    variantId: string;
    productName: string;
    variantName: string;
    unitPrice: number;
    qty: number;
    lineTotal: number;
  }[] = [];

  for (const line of incoming) {
    const v = byId.get(line.variantId);
    const qty = Math.max(1, Math.floor(Number(line.qty) || 0));
    if (!v) return { ok: false, error: "An item in your cart is no longer available." };
    if (!v.inStock) {
      return { ok: false, error: `"${v.product.name} — ${v.name}" is out of stock.` };
    }
    const unitPrice = effectivePrice(v);
    orderItems.push({
      productId: v.productId,
      variantId: v.id,
      productName: v.product.name,
      variantName: v.name,
      unitPrice,
      qty,
      lineTotal: unitPrice * qty,
    });
  }

  const settings = await getSettings();
  const subtotal = orderItems.reduce((s, i) => s + i.lineTotal, 0);
  const deliveryFee = settings.deliveryFee ?? 500;
  const total = subtotal + deliveryFee;

  // Optional deposit slip upload.
  let depositSlipUrl: string | null = null;
  if (paymentMethod === "BANK_DEPOSIT") {
    const slip = formData.get("slip");
    if (isUploadedFile(slip) && slip.size > 0) {
      try {
        depositSlipUrl = await uploadFormFile(slip, "slips");
      } catch {
        return { ok: false, error: "Could not upload the deposit slip. Please try again." };
      }
    }
  }

  const seq = (await prisma.order.count()) + 1;
  const orderNumber = makeOrderNumber(seq);

  await prisma.order.create({
    data: {
      orderNumber,
      customerName,
      address,
      phone1,
      phone2: phone2 || null,
      paymentMethod,
      depositSlipUrl,
      subtotal,
      deliveryFee,
      total,
      status: "PENDING",
      items: { create: orderItems },
    },
  });

  return { ok: true, orderNumber };
}
