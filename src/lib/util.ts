export function slugify(input: string): string {
  return (input || "")
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

// Ensure a slug is unique against a set of existing slugs.
export function uniqueSlug(base: string, existing: Set<string>): string {
  let slug = slugify(base) || "item";
  let candidate = slug;
  let i = 2;
  while (existing.has(candidate)) {
    candidate = `${slug}-${i++}`;
  }
  existing.add(candidate);
  return candidate;
}

export function orderNumber(seq: number): string {
  const d = new Date();
  const yy = String(d.getFullYear()).slice(2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `CS-${yy}${mm}${dd}-${String(seq).padStart(4, "0")}`;
}

// Fisher–Yates shuffle (returns a new array). Used to rotate products randomly
// so nothing is fixed by "most recently added".
export function shuffle<T>(input: readonly T[]): T[] {
  const a = [...input];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
