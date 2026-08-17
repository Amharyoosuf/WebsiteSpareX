"use server";

import Papa from "papaparse";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { slugify } from "@/lib/util";
import { isUploadedFile } from "@/lib/storage";
import { enrichCsvRows, generateSeo, type CsvRow } from "@/lib/ai";

export type ImportResult =
  | { ok: true; created: number; updated: number; variants: number; usedAi: boolean }
  | { ok: false; error: string };

function toBool(v: string, fallback = true): boolean {
  const s = (v || "").trim().toLowerCase();
  if (!s) return fallback;
  if (["no", "false", "0", "out", "out of stock", "outofstock", "n"].includes(s)) return false;
  if (["yes", "true", "1", "in stock", "instock", "y", "in"].includes(s)) return true;
  return fallback;
}

function normalizeRow(r: Record<string, string>): CsvRow {
  // Case-insensitive header lookup.
  const get = (key: string) => {
    const hit = Object.keys(r).find((k) => k.trim().toLowerCase() === key);
    return hit ? String(r[hit] ?? "").trim() : "";
  };
  return {
    main_product: get("main_product") || get("product") || get("name"),
    model: get("model") || get("variant"),
    price: get("price"),
    sale_price: get("sale_price") || get("saleprice"),
    category: get("category"),
    description: get("description"),
    in_stock: get("in_stock") || get("instock") || get("stock"),
    image_url: get("image_url") || get("image") || get("imageurl"),
  };
}

export async function importCsv(formData: FormData): Promise<ImportResult> {
  if (!(await isAdmin())) return { ok: false, error: "Unauthorized" };

  const file = formData.get("file");
  const useAi = formData.get("useAi") === "on";
  if (!isUploadedFile(file) || file.size === 0) {
    return { ok: false, error: "Please choose a CSV file." };
  }

  const text = await file.text();
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
  });

  // Model is optional (a row with no model = a simple one-price product);
  // a row needs at least a product name and a price.
  let rows = (parsed.data || [])
    .map(normalizeRow)
    .filter((r) => r.main_product && r.price);

  if (rows.length === 0) {
    return {
      ok: false,
      error: "No valid rows found. Each row needs at least a product name and a price.",
    };
  }

  const settings = await getSettings();
  const aiKey = settings.openaiApiKey;
  const usedAi = Boolean(useAi && aiKey);
  if (usedAi) {
    rows = await enrichCsvRows(aiKey, rows);
  }

  // Cache categories by lowercased name.
  const existingCats = await prisma.category.findMany();
  const catByName = new Map(existingCats.map((c) => [c.name.trim().toLowerCase(), c]));

  async function resolveCategoryId(name: string): Promise<string | null> {
    const clean = (name || "").trim();
    if (!clean) return null;
    const key = clean.toLowerCase();
    const found = catByName.get(key);
    if (found) return found.id;
    // Create it.
    let slug = slugify(clean) || "category";
    let i = 2;
    while (await prisma.category.findUnique({ where: { slug } })) slug = `${slugify(clean)}-${i++}`;
    const created = await prisma.category.create({ data: { name: clean, slug } });
    catByName.set(key, created);
    return created.id;
  }

  // Group rows by product name.
  const groups = new Map<string, CsvRow[]>();
  for (const r of rows) {
    const key = r.main_product.trim().toLowerCase();
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(r);
  }

  let created = 0;
  let updated = 0;
  let variantCount = 0;

  for (const [, groupRows] of groups) {
    const first = groupRows[0];
    const name = first.main_product.trim();
    const categoryId = await resolveCategoryId(first.category);
    const description = groupRows.find((r) => r.description)?.description || "";
    const imageUrl = groupRows.find((r) => r.image_url)?.image_url || "";

    const baseSlug = slugify(name) || "product";
    const existing = await prisma.product.findUnique({
      where: { slug: baseSlug },
      include: { variants: true, images: true },
    });

    const variantData = groupRows.map((r, i) => {
      const price = Math.max(0, Math.round(Number(r.price) || 0));
      const sp = r.sale_price ? Math.round(Number(r.sale_price)) : null;
      return {
        name: r.model.trim(),
        price,
        salePrice: sp && sp > 0 ? sp : null,
        inStock: toBool(r.in_stock),
        sortOrder: i,
      };
    });

    if (existing) {
      // Add category/description if missing; append new variants; add image if none.
      await prisma.product.update({
        where: { id: existing.id },
        data: {
          categoryId: existing.categoryId ?? categoryId,
          description: existing.description || description,
        },
      });
      const have = new Set(existing.variants.map((v) => v.name.trim().toLowerCase()));
      const toAdd = variantData.filter((v) => !have.has(v.name.toLowerCase()));
      if (toAdd.length) {
        await prisma.productVariant.createMany({
          data: toAdd.map((v, i) => ({ ...v, sortOrder: existing.variants.length + i, productId: existing.id })),
        });
        variantCount += toAdd.length;
      }
      if (existing.images.length === 0 && imageUrl) {
        await prisma.productImage.create({ data: { productId: existing.id, url: imageUrl, sortOrder: 0 } });
      }
      updated++;
    } else {
      // Unique slug.
      let slug = baseSlug;
      let i = 2;
      while (await prisma.product.findUnique({ where: { slug } })) slug = `${baseSlug}-${i++}`;

      let seoTitle: string | null = null;
      let seoDescription: string | null = null;
      if (usedAi) {
        const catName = existingCats.find((c) => c.id === categoryId)?.name || first.category;
        const seo = await generateSeo(aiKey, { name, description, category: catName });
        if (seo) {
          seoTitle = seo.seoTitle;
          seoDescription = seo.seoDescription;
        }
      }

      await prisma.product.create({
        data: {
          name,
          slug,
          description,
          categoryId,
          seoTitle,
          seoDescription,
          images: imageUrl ? { create: [{ url: imageUrl, sortOrder: 0 }] } : undefined,
          variants: { create: variantData },
        },
      });
      created++;
      variantCount += variantData.length;
    }
  }

  revalidatePath("/admin/products");
  revalidatePath("/");
  return { ok: true, created, updated, variants: variantCount, usedAi };
}
