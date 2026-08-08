"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import { slugify } from "@/lib/util";

async function ensureAdmin() {
  if (!(await isAdmin())) throw new Error("Unauthorized");
}

async function uniqueCategorySlug(name: string, excludeId?: string): Promise<string> {
  const base = slugify(name) || "category";
  let slug = base;
  let i = 2;
  // Loop until no other category owns the slug.
  while (true) {
    const found = await prisma.category.findUnique({ where: { slug } });
    if (!found || found.id === excludeId) return slug;
    slug = `${base}-${i++}`;
  }
}

export async function createCategory(formData: FormData) {
  await ensureAdmin();
  const name = String(formData.get("name") || "").trim();
  if (!name) return;
  const sortOrder = Number(formData.get("sortOrder") || 0) || 0;
  await prisma.category.create({
    data: { name, slug: await uniqueCategorySlug(name), sortOrder },
  });
  revalidatePath("/admin/categories");
  revalidatePath("/");
}

export async function updateCategory(formData: FormData) {
  await ensureAdmin();
  const id = String(formData.get("id") || "");
  const name = String(formData.get("name") || "").trim();
  if (!id || !name) return;
  const sortOrder = Number(formData.get("sortOrder") || 0) || 0;
  await prisma.category.update({
    where: { id },
    data: { name, slug: await uniqueCategorySlug(name, id), sortOrder },
  });
  revalidatePath("/admin/categories");
  revalidatePath("/");
}

export async function deleteCategory(formData: FormData) {
  await ensureAdmin();
  const id = String(formData.get("id") || "");
  if (!id) return;
  // Products keep existing (categoryId set null via schema onDelete: SetNull).
  await prisma.category.delete({ where: { id } });
  revalidatePath("/admin/categories");
  revalidatePath("/");
}
