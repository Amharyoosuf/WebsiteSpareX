import "server-only";
import { prisma } from "./db";
import { getSettings } from "./settings";
import { aiRankProducts } from "./ai";

export type SearchCardProduct = {
  id: string;
  name: string;
  slug: string;
  isOnOffer: boolean;
  images: { url: string }[];
  variants: { price: number; salePrice: number | null; inStock: boolean }[];
};

function normalize(s: string): string {
  return (s || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(s: string): string[] {
  return normalize(s).split(" ").filter(Boolean);
}

// Classic Levenshtein distance.
function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const prev = new Array(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;
  for (let i = 1; i <= a.length; i++) {
    let prevDiag = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j];
      prev[j] = Math.min(
        prev[j] + 1,
        prev[j - 1] + 1,
        prevDiag + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
      prevDiag = tmp;
    }
  }
  return prev[b.length];
}

function similarity(a: string, b: string): number {
  const max = Math.max(a.length, b.length);
  if (max === 0) return 1;
  return 1 - levenshtein(a, b) / max;
}

type Scorable = {
  id: string;
  name: string;
  description: string;
  categoryName: string;
};

// Typo-tolerant relevance score. Higher is better.
function score(item: Scorable, qNorm: string, qTokens: string[]): number {
  const nameNorm = normalize(item.name);
  const nameTokens = nameNorm.split(" ").filter(Boolean);
  const descNorm = normalize(item.description);
  const catNorm = normalize(item.categoryName);

  let s = 0;
  if (qNorm && nameNorm.includes(qNorm)) s += 120;
  if (qNorm && catNorm.includes(qNorm)) s += 40;

  for (const qt of qTokens) {
    if (nameNorm.includes(qt)) {
      s += 30;
    } else {
      // Best fuzzy match against any word in the name (handles misspellings).
      let best = 0;
      for (const nt of nameTokens) {
        best = Math.max(best, similarity(qt, nt));
        if (nt.startsWith(qt) || qt.startsWith(nt)) best = Math.max(best, 0.85);
      }
      if (best >= 0.68) s += best * 26;
    }
    if (descNorm.includes(qt)) s += 8;
    if (catNorm.includes(qt)) s += 12;
  }
  return s;
}

const cardSelect = {
  id: true,
  name: true,
  slug: true,
  isOnOffer: true,
  description: true,
  images: { orderBy: { sortOrder: "asc" as const }, take: 1, select: { url: true } },
  variants: { select: { price: true, salePrice: true, inStock: true } },
  category: { select: { name: true } },
};

/**
 * Smart product search:
 *  - always works: case-insensitive + typo-tolerant fuzzy matching.
 *  - optional boost: if an OpenAI key is set and fuzzy results are weak,
 *    AI re-ranks the catalog for synonyms / harder misspellings.
 */
export async function searchProducts(query: string): Promise<SearchCardProduct[]> {
  const qNorm = normalize(query);
  if (!qNorm) return [];
  const qTokens = tokenize(query);

  const products = await prisma.product.findMany({
    where: { isHidden: false },
    orderBy: { createdAt: "desc" },
    take: 500,
    select: cardSelect,
  });

  const scored = products
    .map((p) => ({
      p,
      s: score(
        { id: p.id, name: p.name, description: p.description, categoryName: p.category?.name || "" },
        qNorm,
        qTokens
      ),
    }))
    .filter((x) => x.s > 14)
    .sort((a, b) => b.s - a.s);

  let ordered = scored.map((x) => x.p);
  const strong = scored.length > 0 && scored[0].s >= 30;

  // Optional AI assist when fuzzy is weak.
  if (!strong) {
    const settings = await getSettings();
    if (settings.openaiApiKey) {
      const ids = await aiRankProducts(
        settings.openaiApiKey,
        query,
        products.map((p) => ({ id: p.id, name: p.name, category: p.category?.name }))
      );
      if (ids.length) {
        const byId = new Map(products.map((p) => [p.id, p]));
        const aiOrdered = ids.map((id) => byId.get(id)).filter(Boolean) as typeof products;
        const seen = new Set(aiOrdered.map((p) => p.id));
        ordered = [...aiOrdered, ...ordered.filter((p) => !seen.has(p.id))];
      }
    }
  }

  // Strip scoring-only fields for the card.
  return ordered.slice(0, 48).map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    isOnOffer: p.isOnOffer,
    images: p.images,
    variants: p.variants,
  }));
}
