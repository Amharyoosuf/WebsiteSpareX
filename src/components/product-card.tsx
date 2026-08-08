import Link from "next/link";
import { formatLKR } from "@/lib/money";
import { priceSummary, type VariantLike } from "@/lib/products";

export type CardProduct = {
  name: string;
  slug: string;
  isOnOffer: boolean;
  images: { url: string }[];
  variants: VariantLike[];
};

export function ProductCard({ product }: { product: CardProduct }) {
  const img = product.images[0]?.url || "/placeholder.svg";
  const { min, hasRange, onSale, anyInStock } = priceSummary(product.variants);
  const modelCount = product.variants.length;

  return (
    <Link
      href={`/product/${product.slug}`}
      className="card group flex flex-col overflow-hidden transition-shadow hover:shadow-pop"
    >
      <div className="relative aspect-square overflow-hidden bg-gray-50">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={img}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {product.isOnOffer && (
            <span className="badge bg-brand text-white shadow-sm">On Offer</span>
          )}
          {onSale && <span className="badge bg-red-600 text-white shadow-sm">Sale</span>}
        </div>
        {!anyInStock && (
          <div className="absolute inset-0 grid place-items-center bg-white/60">
            <span className="badge bg-gray-800 text-white">Out of stock</span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-3.5">
        <h3 className="line-clamp-2 text-sm font-semibold text-ink">{product.name}</h3>
        {modelCount > 1 && (
          <p className="mt-0.5 text-xs text-muted">{modelCount} models</p>
        )}
        <div className="mt-auto pt-2">
          <span className="text-base font-bold text-ink">
            {hasRange ? "From " : ""}
            {formatLKR(min)}
          </span>
        </div>
      </div>
    </Link>
  );
}
