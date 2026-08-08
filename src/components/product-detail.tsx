"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "./cart";
import { formatLKR } from "@/lib/money";

type Variant = {
  id: string;
  name: string;
  price: number;
  salePrice: number | null;
  inStock: boolean;
  imageUrl: string | null;
};

export type DetailProduct = {
  id: string;
  name: string;
  slug: string;
  description: string;
  images: { url: string }[];
  variants: Variant[];
};

export function ProductDetail({ product }: { product: DetailProduct }) {
  const { add } = useCart();
  const firstInStock = product.variants.find((v) => v.inStock) || product.variants[0];
  const [selectedId, setSelectedId] = useState<string | undefined>(firstInStock?.id);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const selected = product.variants.find((v) => v.id === selectedId);
  const gallery = product.images.length ? product.images.map((i) => i.url) : ["/placeholder.svg"];
  const [activeImg, setActiveImg] = useState(gallery[0]);

  const mainImg = selected?.imageUrl || activeImg || "/placeholder.svg";
  const eff = selected ? (selected.salePrice && selected.salePrice > 0 ? selected.salePrice : selected.price) : 0;
  const onSale = !!(selected?.salePrice && selected.salePrice > 0 && selected.salePrice < selected.price);
  const canAdd = !!selected && selected.inStock;

  function onSelectVariant(v: Variant) {
    setSelectedId(v.id);
    setAdded(false);
    if (v.imageUrl) setActiveImg(v.imageUrl);
  }

  function handleAdd() {
    if (!selected || !selected.inStock) return;
    add(
      {
        productId: product.id,
        productSlug: product.slug,
        productName: product.name,
        variantId: selected.id,
        variantName: selected.name,
        unitPrice: eff,
        image: selected.imageUrl || gallery[0],
      },
      qty
    );
    setAdded(true);
  }

  return (
    <div className="grid gap-8 md:grid-cols-2">
      {/* Gallery */}
      <div>
        <div className="card overflow-hidden">
          <div className="aspect-square bg-gray-50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={mainImg} alt={product.name} className="h-full w-full object-cover" />
          </div>
        </div>
        {gallery.length > 1 && (
          <div className="mt-3 flex gap-2">
            {gallery.map((url, i) => (
              <button
                key={i}
                onClick={() => setActiveImg(url)}
                className={`h-16 w-16 overflow-hidden rounded-lg border ${
                  activeImg === url ? "border-brand ring-2 ring-brand/30" : "border-line"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div>
        <h1 className="text-2xl font-bold text-ink">{product.name}</h1>

        <div className="mt-3 flex items-baseline gap-3">
          <span className="text-2xl font-extrabold text-ink">{formatLKR(eff)}</span>
          {onSale && selected && (
            <span className="text-base text-muted line-through">{formatLKR(selected.price)}</span>
          )}
        </div>

        {/* Model selector */}
        {product.variants.length > 0 && (
          <div className="mt-6">
            <div className="mb-2 text-sm font-semibold text-ink">
              Model{product.variants.length > 1 ? "s" : ""}
            </div>
            <div className="flex flex-wrap gap-2">
              {product.variants.map((v) => {
                const isSel = v.id === selectedId;
                return (
                  <button
                    key={v.id}
                    onClick={() => onSelectVariant(v)}
                    disabled={!v.inStock}
                    className={`rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors ${
                      isSel
                        ? "border-brand bg-brand-light text-brand"
                        : "border-line bg-white text-ink hover:border-brand"
                    } ${!v.inStock ? "cursor-not-allowed opacity-50 line-through" : ""}`}
                  >
                    {v.name}
                  </button>
                );
              })}
            </div>
            {selected && !selected.inStock && (
              <p className="mt-2 text-sm font-medium text-red-600">This model is out of stock.</p>
            )}
          </div>
        )}

        {/* Quantity + add */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center rounded-lg border border-line">
            <button
              className="px-3.5 py-2 text-lg text-ink disabled:opacity-40"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              disabled={qty <= 1}
              aria-label="Decrease quantity"
            >
              −
            </button>
            <span className="w-10 text-center text-sm font-semibold">{qty}</span>
            <button
              className="px-3.5 py-2 text-lg text-ink"
              onClick={() => setQty((q) => q + 1)}
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
          <button className="btn-primary flex-1 sm:flex-none sm:px-8" onClick={handleAdd} disabled={!canAdd}>
            Add to Cart
          </button>
        </div>

        {added && (
          <div className="mt-4 flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            <span>Added to cart.</span>
            <Link href="/cart" className="font-semibold underline">
              View cart →
            </Link>
          </div>
        )}

        {product.description && (
          <div className="mt-8 border-t border-line pt-6">
            <h2 className="mb-2 text-sm font-semibold text-ink">Description</h2>
            <p className="whitespace-pre-line text-sm leading-relaxed text-muted">
              {product.description}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
