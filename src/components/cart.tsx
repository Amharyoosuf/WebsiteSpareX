"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { trackEvent } from "./tracker";

export type CartItem = {
  productId: string;
  productSlug: string;
  productName: string;
  variantId: string;
  variantName: string;
  unitPrice: number;
  image?: string;
  qty: number;
};

type CartContext = {
  items: CartItem[];
  count: number;
  subtotal: number;
  add: (item: Omit<CartItem, "qty">, qty?: number) => void;
  setQty: (variantId: string, qty: number) => void;
  remove: (variantId: string) => void;
  clear: () => void;
  ready: boolean;
};

const Ctx = createContext<CartContext | null>(null);
const KEY = "cs_cart_v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  // Load once on mount.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
    setReady(true);
  }, []);

  // Persist on change (after initial load).
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {}
  }, [items, ready]);

  const api = useMemo<CartContext>(() => {
    const subtotal = items.reduce((s, i) => s + i.unitPrice * i.qty, 0);
    const count = items.reduce((s, i) => s + i.qty, 0);
    return {
      items,
      count,
      subtotal,
      ready,
      add: (item, qty = 1) => {
        trackEvent("add_to_cart", { productId: item.productId });
        setItems((prev) => {
          const idx = prev.findIndex((p) => p.variantId === item.variantId);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = { ...next[idx], qty: next[idx].qty + qty };
            return next;
          }
          return [...prev, { ...item, qty }];
        });
      },
      setQty: (variantId, qty) =>
        setItems((prev) =>
          prev
            .map((p) => (p.variantId === variantId ? { ...p, qty: Math.max(0, qty) } : p))
            .filter((p) => p.qty > 0)
        ),
      remove: (variantId) => setItems((prev) => prev.filter((p) => p.variantId !== variantId)),
      clear: () => setItems([]),
    };
  }, [items, ready]);

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
