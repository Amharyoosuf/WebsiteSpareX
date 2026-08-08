"use server";

import { redirect } from "next/navigation";
import { checkPassword, createAdminSession, destroyAdminSession } from "@/lib/auth";

export async function loginAction(
  _prev: unknown,
  formData: FormData
): Promise<{ error?: string; ok?: boolean }> {
  const password = String(formData.get("password") || "");
  if (!checkPassword(password)) {
    return { error: "Incorrect password." };
  }
  await createAdminSession();
  return { ok: true };
}

export async function logoutAction() {
  await destroyAdminSession();
  redirect("/admin/login");
}
