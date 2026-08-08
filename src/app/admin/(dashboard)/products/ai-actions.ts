"use server";

import { isAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { generateDescription, generateSeo } from "@/lib/ai";

export type GenTextResult = { ok: true; text: string } | { ok: false; error: string };
export type GenSeoResult =
  | { ok: true; seoTitle: string; seoDescription: string }
  | { ok: false; error: string };

export async function generateDescriptionAction(input: {
  name: string;
  category?: string;
}): Promise<GenTextResult> {
  if (!(await isAdmin())) return { ok: false, error: "Unauthorized" };
  if (!input.name?.trim()) return { ok: false, error: "Enter a product name first." };
  const settings = await getSettings();
  if (!settings.openaiApiKey) return { ok: false, error: "Add an OpenAI key in Settings first." };
  const text = await generateDescription(settings.openaiApiKey, {
    name: input.name.trim(),
    category: input.category,
  });
  if (!text) return { ok: false, error: "Could not generate. Please try again." };
  return { ok: true, text };
}

export async function generateSeoAction(input: {
  name: string;
  description?: string;
  category?: string;
}): Promise<GenSeoResult> {
  if (!(await isAdmin())) return { ok: false, error: "Unauthorized" };
  if (!input.name?.trim()) return { ok: false, error: "Enter a product name first." };
  const settings = await getSettings();
  if (!settings.openaiApiKey) return { ok: false, error: "Add an OpenAI key in Settings first." };
  const seo = await generateSeo(settings.openaiApiKey, {
    name: input.name.trim(),
    description: input.description,
    category: input.category,
  });
  if (!seo) return { ok: false, error: "Could not generate. Please try again." };
  return { ok: true, seoTitle: seo.seoTitle, seoDescription: seo.seoDescription };
}
