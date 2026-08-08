import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const IMG = "/placeholder.svg";

const categories = [
  { name: "Fan Spares", slug: "fan-spares", sortOrder: 1 },
  { name: "Motor Spares", slug: "motor-spares", sortOrder: 2 },
  { name: "Electrical", slug: "electrical", sortOrder: 3 },
  { name: "Pump Parts", slug: "pump-parts", sortOrder: 4 },
];

const products = [
  {
    name: "Fan Motor",
    slug: "fan-motor",
    description:
      "Durable copper-winding fan motor. Choose the wattage that matches your fan.",
    category: "motor-spares",
    isOnOffer: true,
    variants: [
      { name: "60W", price: 2500, inStock: true },
      { name: "80W", price: 2900, inStock: true },
      { name: "100W", price: 3400, inStock: false },
    ],
  },
  {
    name: "Ceiling Fan Capacitor",
    slug: "ceiling-fan-capacitor",
    description: "Reliable start/run capacitor for ceiling fans.",
    category: "electrical",
    isOnOffer: true,
    variants: [
      { name: "2.5 µF", price: 450, inStock: true },
      { name: "3.5 µF", price: 500, salePrice: 420, inStock: true },
      { name: "4 µF", price: 550, inStock: true },
    ],
  },
  {
    name: "Table Fan Blade",
    slug: "table-fan-blade",
    description: "Balanced replacement blade for table fans.",
    category: "fan-spares",
    isOnOffer: false,
    variants: [
      { name: "16 inch", price: 750, inStock: true },
      { name: "18 inch", price: 850, inStock: true },
    ],
  },
  {
    name: "Water Pump Impeller",
    slug: "water-pump-impeller",
    description: "Brass impeller for household water pumps.",
    category: "pump-parts",
    isOnOffer: false,
    variants: [
      { name: "0.5 HP", price: 1800, inStock: true },
      { name: "1 HP", price: 2600, inStock: true },
    ],
  },
  {
    name: "Motor Bearing 6203",
    slug: "motor-bearing-6203",
    description: "Sealed ball bearing, long life.",
    category: "motor-spares",
    isOnOffer: true,
    variants: [{ name: "Standard", price: 350, salePrice: 299, inStock: true }],
  },
  {
    name: "Fan Regulator",
    slug: "fan-regulator",
    description: "Smooth speed control for ceiling fans.",
    category: "electrical",
    isOnOffer: false,
    variants: [
      { name: "5-step", price: 600, inStock: true },
      { name: "Dimmer", price: 900, inStock: true },
    ],
  },
];

async function main() {
  // Settings singleton with sensible demo values.
  await prisma.settings.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      shopName: "SpareX",
      shopAddress: "No. 123, Main Street, Colombo 11",
      phone1: "011 234 5678",
      phone2: "077 123 4567",
      email: "hello@sparex.lk",
      bankName: "Commercial Bank",
      bankAccountName: "SpareX",
      bankAccountNumber: "8001234567",
      bankBranch: "Pettah",
      deliveryFee: 500,
    },
  });

  const catMap = {};
  for (const c of categories) {
    const cat = await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, sortOrder: c.sortOrder },
      create: c,
    });
    catMap[c.slug] = cat.id;
  }

  for (const p of products) {
    const existing = await prisma.product.findUnique({ where: { slug: p.slug } });
    if (existing) {
      // Reset variants/images to keep seed idempotent.
      await prisma.productVariant.deleteMany({ where: { productId: existing.id } });
      await prisma.productImage.deleteMany({ where: { productId: existing.id } });
      await prisma.product.update({
        where: { id: existing.id },
        data: {
          name: p.name,
          description: p.description,
          isOnOffer: p.isOnOffer,
          categoryId: catMap[p.category],
          images: { create: [{ url: IMG, sortOrder: 0 }] },
          variants: {
            create: p.variants.map((v, i) => ({ ...v, sortOrder: i })),
          },
        },
      });
    } else {
      await prisma.product.create({
        data: {
          name: p.name,
          slug: p.slug,
          description: p.description,
          isOnOffer: p.isOnOffer,
          categoryId: catMap[p.category],
          images: { create: [{ url: IMG, sortOrder: 0 }] },
          variants: {
            create: p.variants.map((v, i) => ({ ...v, sortOrder: i })),
          },
        },
      });
    }
  }

  console.log("Seed complete:", categories.length, "categories,", products.length, "products.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
