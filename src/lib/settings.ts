import { prisma } from "./db";

export type ShopSettings = Awaited<ReturnType<typeof getSettings>>;

// Returns the singleton settings row, creating it with defaults if missing.
export async function getSettings() {
  const existing = await prisma.settings.findUnique({ where: { id: "singleton" } });
  if (existing) return existing;
  return prisma.settings.create({ data: { id: "singleton" } });
}
