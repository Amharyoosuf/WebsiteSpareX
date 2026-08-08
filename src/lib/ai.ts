import "server-only";

export type SeoResult = { seoTitle: string; seoDescription: string };

export type CsvRow = {
  main_product: string;
  model: string;
  price: string;
  sale_price: string;
  category: string;
  description: string;
  in_stock: string;
  image_url: string;
};

function client(apiKey: string) {
  // Lazy import so OpenAI isn't loaded unless a key is present.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const OpenAI = require("openai").default ?? require("openai");
  return new OpenAI({ apiKey });
}

/**
 * Generate SEO title + description for a product.
 * Returns null when no API key is set or on any failure (caller then skips SEO).
 */
export async function generateSeo(
  apiKey: string,
  product: { name: string; description?: string; category?: string }
): Promise<SeoResult | null> {
  if (!apiKey) return null;
  try {
    const openai = client(apiKey);
    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You write concise SEO metadata for an online spare-parts shop in Sri Lanka. " +
            'Reply ONLY with JSON: {"seoTitle": string (<=60 chars), "seoDescription": string (<=155 chars)}.',
        },
        {
          role: "user",
          content: `Product: ${product.name}\nCategory: ${product.category || "-"}\nDescription: ${product.description || "-"}`,
        },
      ],
    });
    const txt = res.choices?.[0]?.message?.content || "{}";
    const parsed = JSON.parse(txt);
    if (parsed && (parsed.seoTitle || parsed.seoDescription)) {
      return {
        seoTitle: String(parsed.seoTitle || product.name).slice(0, 70),
        seoDescription: String(parsed.seoDescription || "").slice(0, 170),
      };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Generate a short, friendly product description.
 * Returns null when no key is set or on any failure.
 */
export async function generateDescription(
  apiKey: string,
  product: { name: string; category?: string }
): Promise<string | null> {
  if (!apiKey) return null;
  try {
    const openai = client(apiKey);
    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.6,
      messages: [
        {
          role: "system",
          content:
            "You write short product descriptions for a Sri Lankan spare-parts shop. " +
            "Write 2–3 plain sentences, factual and easy to read. No markdown, no emojis, no price.",
        },
        {
          role: "user",
          content: `Product: ${product.name}\nCategory: ${product.category || "-"}`,
        },
      ],
    });
    const txt = res.choices?.[0]?.message?.content?.trim();
    return txt || null;
  } catch {
    return null;
  }
}

/**
 * Ask AI to rank the most relevant products for a search query.
 * Returns an ordered list of product ids (best first), or [] on failure / no key.
 */
export async function aiRankProducts(
  apiKey: string,
  query: string,
  items: { id: string; name: string; category?: string }[]
): Promise<string[]> {
  if (!apiKey || items.length === 0) return [];
  try {
    const openai = client(apiKey);
    const catalog = items.slice(0, 120).map((p) => ({ id: p.id, name: p.name, category: p.category || "" }));
    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You match a shopper's search to spare-parts products. Consider synonyms, " +
            "misspellings and Sri Lankan usage. Return ONLY the relevant items, best first. " +
            'Reply as JSON: {"ids": string[]}. Return an empty array if nothing fits.',
        },
        { role: "user", content: `Query: "${query}"\nProducts: ${JSON.stringify(catalog)}` },
      ],
    });
    const txt = res.choices?.[0]?.message?.content || "{}";
    const parsed = JSON.parse(txt);
    return Array.isArray(parsed.ids) ? parsed.ids.filter((x: unknown) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

/**
 * Use AI to tidy/categorize imported CSV rows: fill missing categories, clean up
 * names. Returns the input unchanged when no key is set or on any error.
 */
export async function enrichCsvRows(apiKey: string, rows: CsvRow[]): Promise<CsvRow[]> {
  if (!apiKey || rows.length === 0) return rows;
  try {
    const openai = client(apiKey);
    // Only send the fields needed for categorization to keep tokens small.
    const compact = rows.map((r, i) => ({
      i,
      name: r.main_product,
      model: r.model,
      category: r.category,
    }));
    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You organize a spare-parts catalog. For each item, return a sensible short " +
            "category (Title Case) if missing, and a cleaned product name. " +
            'Reply ONLY as JSON: {"items":[{"i":number,"name":string,"category":string}]}.',
        },
        { role: "user", content: JSON.stringify(compact) },
      ],
    });
    const txt = res.choices?.[0]?.message?.content || "{}";
    const parsed = JSON.parse(txt);
    const byIndex = new Map<number, { name?: string; category?: string }>();
    for (const it of parsed.items || []) {
      if (typeof it.i === "number") byIndex.set(it.i, it);
    }
    return rows.map((r, i) => {
      const fix = byIndex.get(i);
      if (!fix) return r;
      return {
        ...r,
        main_product: fix.name?.trim() || r.main_product,
        category: r.category?.trim() || fix.category?.trim() || r.category,
      };
    });
  } catch {
    return rows;
  }
}
