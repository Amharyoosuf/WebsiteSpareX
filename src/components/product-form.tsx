"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { saveProduct } from "@/app/admin/(dashboard)/products/actions";
import {
  generateDescriptionAction,
  generateSeoAction,
} from "@/app/admin/(dashboard)/products/ai-actions";

type Category = { id: string; name: string };
type ExistingImage = { id: string; url: string };
type Row = {
  rowKey: string;
  id?: string;
  name: string;
  price: string;
  salePrice: string;
  inStock: boolean;
  imageUrl?: string | null;
};

export type EditProduct = {
  id: string;
  name: string;
  description: string;
  categoryId: string | null;
  isOnOffer: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
  images: ExistingImage[];
  variants: {
    id: string;
    name: string;
    price: number;
    salePrice: number | null;
    inStock: boolean;
    imageUrl: string | null;
  }[];
};

// Stable key for initial rows (deterministic across SSR + hydration); a random
// key is only used for rows the user adds at runtime (client-only, no SSR).
function blankRow(rowKey: string): Row {
  return { rowKey, name: "", price: "", salePrice: "", inStock: true, imageUrl: null };
}

export function ProductForm({
  categories,
  product,
  aiEnabled,
}: {
  categories: Category[];
  product?: EditProduct;
  aiEnabled: boolean;
}) {
  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? "");
  const [newCategory, setNewCategory] = useState("");
  const [seoTitle, setSeoTitle] = useState(product?.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState(product?.seoDescription ?? "");

  const [rows, setRows] = useState<Row[]>(
    product && product.variants.length
      ? product.variants.map((v) => ({
          rowKey: v.id, // stable existing id
          id: v.id,
          name: v.name,
          price: String(v.price),
          salePrice: v.salePrice != null ? String(v.salePrice) : "",
          inStock: v.inStock,
          imageUrl: v.imageUrl,
        }))
      : [blankRow("row-0")]
  );
  const [images, setImages] = useState<ExistingImage[]>(product?.images ?? []);
  const [formError, setFormError] = useState<string | null>(null);

  const [descBusy, setDescBusy] = useState(false);
  const [seoBusy, setSeoBusy] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  function updateRow(rowKey: string, patch: Partial<Row>) {
    setRows((r) => r.map((row) => (row.rowKey === rowKey ? { ...row, ...patch } : row)));
  }
  function removeRow(rowKey: string) {
    setRows((r) => (r.length > 1 ? r.filter((row) => row.rowKey !== rowKey) : r));
  }

  function selectedCategoryName(): string {
    if (categoryId === "__new__") return newCategory.trim();
    return categories.find((c) => c.id === categoryId)?.name || "";
  }

  async function onGenerateDescription() {
    setAiError(null);
    setDescBusy(true);
    const res = await generateDescriptionAction({ name, category: selectedCategoryName() });
    if (res.ok) setDescription(res.text);
    else setAiError(res.error);
    setDescBusy(false);
  }

  async function onGenerateSeo() {
    setAiError(null);
    setSeoBusy(true);
    const res = await generateSeoAction({ name, description, category: selectedCategoryName() });
    if (res.ok) {
      setSeoTitle(res.seoTitle);
      setSeoDescription(res.seoDescription);
    } else setAiError(res.error);
    setSeoBusy(false);
  }

  const variantsJson = JSON.stringify(
    rows.map((r) => ({
      rowKey: r.rowKey,
      id: r.id,
      name: r.name,
      price: r.price,
      salePrice: r.salePrice,
      inStock: r.inStock,
      imageUrl: r.imageUrl ?? null,
    }))
  );

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    const validRows = rows.filter((r) => r.name.trim() !== "");
    if (!name.trim()) {
      e.preventDefault();
      setFormError("Enter a product name.");
      return;
    }
    if (validRows.length === 0) {
      e.preventDefault();
      setFormError("Add at least one model with a name and price.");
      return;
    }
    if (validRows.some((r) => !r.price || Number(r.price) <= 0)) {
      e.preventDefault();
      setFormError("Every model needs a price greater than 0.");
      return;
    }
    setFormError(null);
    // allow native submission → server action runs and redirects.
  }

  return (
    <form action={saveProduct} onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-3">
      {product && <input type="hidden" name="id" value={product.id} />}
      <input type="hidden" name="variants" value={variantsJson} readOnly />

      {/* Main details */}
      <div className="space-y-6 lg:col-span-2">
        <section className="card p-4 sm:p-5">
          <h2 className="mb-4 text-base font-bold text-ink">Product details</h2>
          <div className="grid gap-4">
            <div>
              <label className="label" htmlFor="name">Product name *</label>
              <input
                id="name"
                name="name"
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="e.g. Fan Motor"
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="label mb-0" htmlFor="description">Description</label>
                <AiButton
                  busy={descBusy}
                  enabled={aiEnabled}
                  onClick={onGenerateDescription}
                  label="Write with AI"
                />
              </div>
              <textarea
                id="description"
                name="description"
                rows={4}
                className="input"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the part, or generate it with AI."
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="categoryId">Category</label>
                <select
                  id="categoryId"
                  name="categoryId"
                  className="input"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                >
                  <option value="">— None —</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                  <option value="__new__">+ New category…</option>
                </select>
                {categoryId === "__new__" && (
                  <input
                    name="newCategory"
                    className="input mt-2"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="New category name"
                  />
                )}
              </div>
              <div className="flex items-end">
                <label className="flex cursor-pointer items-center gap-2 pb-2.5">
                  <input type="checkbox" name="isOnOffer" defaultChecked={product?.isOnOffer} className="h-4 w-4" />
                  <span className="text-sm font-medium text-ink">Show in “On Offer”</span>
                </label>
              </div>
            </div>
          </div>
        </section>

        {/* Models / variants */}
        <section className="card p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-bold text-ink">Models</h2>
            <button type="button" className="btn-outline" onClick={() => setRows((r) => [...r, blankRow(crypto.randomUUID())])}>
              + Add model
            </button>
          </div>
          <p className="mb-4 text-sm text-muted">
            Each model (e.g. 60W, 80W) has its own price and stock. Sale price is optional.
          </p>
          <div className="space-y-4">
            {rows.map((row) => (
              <div key={row.rowKey} className="rounded-lg border border-line p-3 sm:p-4">
                <div className="grid gap-3 sm:grid-cols-12">
                  <div className="sm:col-span-4">
                    <label className="label">Model name</label>
                    <input
                      className="input"
                      placeholder="e.g. 60W"
                      value={row.name}
                      onChange={(e) => updateRow(row.rowKey, { name: e.target.value })}
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="label">Price (Rs)</label>
                    <input
                      className="input"
                      type="number"
                      inputMode="numeric"
                      value={row.price}
                      onChange={(e) => updateRow(row.rowKey, { price: e.target.value })}
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="label">Sale price</label>
                    <input
                      className="input"
                      type="number"
                      inputMode="numeric"
                      placeholder="optional"
                      value={row.salePrice}
                      onChange={(e) => updateRow(row.rowKey, { salePrice: e.target.value })}
                    />
                  </div>
                  <div className="flex items-end sm:col-span-2">
                    <label className="flex cursor-pointer items-center gap-2 pb-2.5">
                      <input
                        type="checkbox"
                        checked={row.inStock}
                        onChange={(e) => updateRow(row.rowKey, { inStock: e.target.checked })}
                        className="h-4 w-4"
                      />
                      <span className="text-sm text-ink">In stock</span>
                    </label>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {row.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={row.imageUrl} alt="" className="h-10 w-10 rounded border border-line object-cover" />
                    )}
                    <div>
                      <label className="mb-1 block text-xs text-muted">Model image (optional)</label>
                      <input type="file" name={`variantImage_${row.rowKey}`} accept="image/*" className="text-xs text-muted" />
                    </div>
                  </div>
                  {rows.length > 1 && (
                    <button type="button" className="text-sm text-red-600 hover:underline" onClick={() => removeRow(row.rowKey)}>
                      Remove model
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Sidebar: images + SEO */}
      <div className="space-y-6 lg:col-span-1">
        <section className="card p-4 sm:p-5">
          <h2 className="mb-3 text-base font-bold text-ink">Images</h2>
          {images.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {images.map((img) => (
                <div key={img.id} className="relative">
                  <input type="hidden" name="keepImage" value={img.id} />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt="" className="h-16 w-16 rounded-lg border border-line object-cover" />
                  <button
                    type="button"
                    aria-label="Remove image"
                    onClick={() => setImages((im) => im.filter((x) => x.id !== img.id))}
                    className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-red-600 text-xs text-white"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          <input type="file" name="images" accept="image/*" multiple className="block w-full text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-brand file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-brand-dark" />
          <p className="mt-2 text-xs text-muted">Add one or more photos. If none, a placeholder is shown.</p>
        </section>

        <section className="card p-4 sm:p-5">
          <div className="mb-1 flex items-center justify-between">
            <h2 className="text-base font-bold text-ink">SEO</h2>
            <AiButton busy={seoBusy} enabled={aiEnabled} onClick={onGenerateSeo} label="Generate SEO" />
          </div>
          <p className="mb-3 text-xs text-muted">
            {aiEnabled
              ? "Fill manually, generate now, or leave blank to auto-generate on save."
              : "Optional. Add an OpenAI key in Settings to auto-generate these."}
          </p>
          <div className="grid gap-3">
            <div>
              <label className="label" htmlFor="seoTitle">SEO title</label>
              <input id="seoTitle" name="seoTitle" className="input" value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="seoDescription">SEO description</label>
              <textarea id="seoDescription" name="seoDescription" rows={3} className="input" value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} />
            </div>
          </div>
        </section>

        <div className="card p-4 sm:p-5">
          {aiError && <p className="mb-3 text-sm text-amber-700">{aiError}</p>}
          {formError && <p className="mb-3 text-sm text-red-600">{formError}</p>}
          <SubmitButton isEdit={!!product} />
          <Link href="/admin/products" className="btn-ghost mt-2 w-full">Cancel</Link>
        </div>
      </div>
    </form>
  );
}

function AiButton({
  busy,
  enabled,
  onClick,
  label,
}: {
  busy: boolean;
  enabled: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!enabled || busy}
      title={enabled ? "" : "Add an OpenAI key in Settings to enable"}
      className="inline-flex items-center gap-1 rounded-lg border border-brand/30 bg-brand-light px-2.5 py-1 text-xs font-semibold text-brand hover:bg-brand/10 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {busy ? "Generating…" : `✨ ${label}`}
    </button>
  );
}

function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary w-full" disabled={pending}>
      {pending ? "Saving…" : isEdit ? "Save changes" : "Create product"}
    </button>
  );
}
