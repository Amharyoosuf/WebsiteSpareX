"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { slugify } from "@/lib/util";
import { uploadFormFile, isUploadedFile } from "@/lib/storage";
import { generateSeo } from "@/lib/ai";

async function ensureAdmin() {
  if (!(await isAdmin())) throw new Error("Unauthorized");
}

async function getOrCreateCategoryId(name: string): Promise<string> {
  const clean = name.trim();
  const existing = await prisma.category.findFirst({
    where: { name: { equals: clean } },
  });
  if (existing) return existing.id;
  let slug = slugify(clean) || "category";
  let i = 2;
  while (await prisma.category.findUnique({ where: { slug } })) slug = `${slugify(clean)}-${i++}`;
  const created = await prisma.category.create({ data: { name: clean, slug } });
  return created.id;
}

async function uniqueProductSlug(name: string, excludeId?: string): Promise<string> {
  const base = slugify(name) || "product";
  let slug = base;
  let i = 2;
  while (true) {
    const found = await prisma.product.findUnique({ where: { slug } });
    if (!found || found.id === excludeId) return slug;
    slug = `${base}-${i++}`;
  }
}

type IncomingVariant = {
  rowKey: string;
  id?: string;
  name: string;
  price: number | string;
  salePrice?: number | string | null;
  inStock: boolean;
  imageUrl?: string | null;
};

export async function saveProduct(formData: FormData) {
  await ensureAdmin();

  const id = String(formData.get("id") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();
  let categoryId = String(formData.get("categoryId") || "").trim() || null;
  const isOnOffer = formData.get("isOnOffer") === "on";

  // Inline "create new category" from the product form dropdown.
  if (categoryId === "__new__") {
    const newCategory = String(formData.get("newCategory") || "").trim();
    categoryId = newCategory ? await getOrCreateCategoryId(newCategory) : null;
  }
  let seoTitle = String(formData.get("seoTitle") || "").trim();
  let seoDescription = String(formData.get("seoDescription") || "").trim();

  if (!name) throw new Error("Product name is required.");

  // Parse variants.
  let variants: IncomingVariant[] = [];
  try {
    variants = JSON.parse(String(formData.get("variants") || "[]"));
  } catch {
    variants = [];
  }
  variants = variants.filter((v) => v && String(v.name).trim() !== "");
  if (variants.length === 0) {
    throw new Error("Add at least one model (e.g. 60W) with a price.");
  }

  // Resolve per-variant image uploads.
  const resolvedVariants: {
    name: string;
    price: number;
    salePrice: number | null;
    inStock: boolean;
    imageUrl: string | null;
    sortOrder: number;
  }[] = [];
  for (let i = 0; i < variants.length; i++) {
    const v = variants[i];
    const file = formData.get(`variantImage_${v.rowKey}`);
    let imageUrl = v.imageUrl || null;
    if (isUploadedFile(file) && file.size > 0) {
      imageUrl = await uploadFormFile(file, "products");
    }
    const price = Math.max(0, Math.round(Number(v.price) || 0));
    const salePriceNum =
      v.salePrice === "" || v.salePrice == null ? null : Math.round(Number(v.salePrice));
    resolvedVariants.push({
      name: String(v.name).trim(),
      price,
      salePrice: salePriceNum && salePriceNum > 0 ? salePriceNum : null,
      inStock: Boolean(v.inStock),
      imageUrl,
      sortOrder: i,
    });
  }

  // New gallery image uploads.
  const newImageFiles = formData.getAll("images").filter((f): f is File => isUploadedFile(f) && f.size > 0);
  const newImageUrls: string[] = [];
  for (const f of newImageFiles) {
    const url = await uploadFormFile(f, "products");
    if (url) newImageUrls.push(url);
  }

  // Optional AI SEO (only when a key is set and no manual SEO provided).
  const settings = await getSettings();
  if (settings.openaiApiKey && (!seoTitle || !seoDescription)) {
    const category = categoryId
      ? (await prisma.category.findUnique({ where: { id: categoryId } }))?.name
      : undefined;
    const seo = await generateSeo(settings.openaiApiKey, { name, description, category });
    if (seo) {
      seoTitle = seoTitle || seo.seoTitle;
      seoDescription = seoDescription || seo.seoDescription;
    }
  }

  if (id) {
    // Update existing product.
    const existing = await prisma.product.findUnique({
      where: { id },
      include: { images: true },
    });
    if (!existing) throw new Error("Product not found.");

    // Images to keep.
    const keepIds = new Set(formData.getAll("keepImage").map((v) => String(v)));
    const removeIds = existing.images.filter((img) => !keepIds.has(img.id)).map((i) => i.id);

    await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id },
        data: { name, description, categoryId, isOnOffer, seoTitle: seoTitle || null, seoDescription: seoDescription || null },
      });
      if (removeIds.length) {
        await tx.productImage.deleteMany({ where: { id: { in: removeIds } } });
      }
      const baseOrder = existing.images.length;
      if (newImageUrls.length) {
        await tx.productImage.createMany({
          data: newImageUrls.map((url, i) => ({ productId: id, url, sortOrder: baseOrder + i })),
        });
      }
      // Replace variants wholesale.
      await tx.productVariant.deleteMany({ where: { productId: id } });
      await tx.productVariant.createMany({
        data: resolvedVariants.map((v) => ({ ...v, productId: id })),
      });
    });
  } else {
    // Create new product.
    const slug = await uniqueProductSlug(name);
    await prisma.product.create({
      data: {
        name,
        slug,
        description,
        categoryId,
        isOnOffer,
        seoTitle: seoTitle || null,
        seoDescription: seoDescription || null,
        images: { create: newImageUrls.map((url, i) => ({ url, sortOrder: i })) },
        variants: { create: resolvedVariants },
      },
    });
  }

  revalidatePath("/admin/products");
  revalidatePath("/");
  redirect("/admin/products");
}

export async function deleteProduct(formData: FormData) {
  await ensureAdmin();
  const id = String(formData.get("id") || "");
  if (!id) return;
  await prisma.product.delete({ where: { id } });
  revalidatePath("/admin/products");
  revalidatePath("/");
}

export async function toggleOffer(formData: FormData) {
  await ensureAdmin();
  const id = String(formData.get("id") || "");
  const next = formData.get("next") === "true";
  if (!id) return;
  await prisma.product.update({ where: { id }, data: { isOnOffer: next } });
  revalidatePath("/admin/products");
  revalidatePath("/");
}

export async function toggleHidden(formData: FormData) {
  await ensureAdmin();
  const id = String(formData.get("id") || "");
  const next = formData.get("next") === "true";
  if (!id) return;
  await prisma.product.update({ where: { id }, data: { isHidden: next } });
  revalidatePath("/admin/products");
  revalidatePath("/");
}
