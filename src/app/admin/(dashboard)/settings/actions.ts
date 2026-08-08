"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/auth";

export async function updateSettings(formData: FormData) {
  if (!(await isAdmin())) throw new Error("Unauthorized");

  const str = (k: string) => String(formData.get(k) || "").trim();
  const deliveryFee = Math.max(0, Math.round(Number(formData.get("deliveryFee")) || 0));

  // Key handling: blank field keeps the existing key; "clearKey" removes it.
  const clearKey = formData.get("clearKey") === "on";
  const newKey = str("openaiApiKey");

  const data: Record<string, unknown> = {
    shopName: str("shopName") || "SpareX",
    shopAddress: str("shopAddress"),
    phone1: str("phone1"),
    phone2: str("phone2"),
    email: str("email"),
    bankName: str("bankName"),
    bankAccountName: str("bankAccountName"),
    bankAccountNumber: str("bankAccountNumber"),
    bankBranch: str("bankBranch"),
    deliveryFee,
  };

  if (clearKey) {
    data.openaiApiKey = "";
  } else if (newKey) {
    data.openaiApiKey = newKey;
  }

  await prisma.settings.upsert({
    where: { id: "singleton" },
    update: data,
    create: { id: "singleton", ...(data as object) },
  });

  revalidatePath("/admin/settings");
  revalidatePath("/", "layout");
}
