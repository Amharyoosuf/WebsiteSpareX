export type VariantLike = {
  price: number;
  salePrice?: number | null;
  inStock: boolean;
};

export type ProductLike = {
  variants: VariantLike[];
};

// Effective price of a variant (sale price if set, else price).
export function effectivePrice(v: VariantLike): number {
  return v.salePrice != null && v.salePrice > 0 ? v.salePrice : v.price;
}

export function priceSummary(variants: VariantLike[]) {
  if (!variants.length) {
    return { min: 0, max: 0, hasRange: false, onSale: false, anyInStock: false };
  }
  const effs = variants.map(effectivePrice);
  const min = Math.min(...effs);
  const max = Math.max(...effs);
  const onSale = variants.some((v) => v.salePrice != null && v.salePrice > 0 && v.salePrice < v.price);
  const anyInStock = variants.some((v) => v.inStock);
  return { min, max, hasRange: min !== max, onSale, anyInStock };
}
