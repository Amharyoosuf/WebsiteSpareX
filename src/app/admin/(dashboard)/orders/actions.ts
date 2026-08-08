"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/constants";

export async function updateOrderStatus(formData: FormData) {
  if (!(await isAdmin())) throw new Error("Unauthorized");
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "") as OrderStatus;
  if (!id || !ORDER_STATUSES.includes(status)) return;
  await prisma.order.update({ where: { id }, data: { status } });
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath("/admin/orders");
  revalidatePath("/admin");
}
