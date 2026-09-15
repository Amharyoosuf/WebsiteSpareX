import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { CartProvider } from "@/components/cart";
import { SiteHeader } from "@/components/site-header";
import { CategoryBar } from "@/components/category-bar";
import { PageTracker } from "@/components/tracker";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const [settings, categories] = await Promise.all([
    getSettings(),
    prisma.category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
  ]);

  return (
    <CartProvider>
      <PageTracker />
      <SiteHeader shopName={settings.shopName || "Ceylon Spares"} />
      <CategoryBar categories={categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug }))} />
      <main className="min-h-[70vh]">{children}</main>
      <footer className="mt-16 border-t border-line bg-gray-50">
        <div className="container-page grid gap-8 py-10 sm:grid-cols-3">
          <div>
            <div className="text-base font-bold text-ink">{settings.shopName}</div>
            <p className="mt-2 text-sm text-muted">{settings.shopAddress}</p>
          </div>
          <div>
            <div className="text-sm font-semibold text-ink">Contact</div>
            <ul className="mt-2 space-y-1 text-sm text-muted">
              {settings.phone1 && <li>{settings.phone1}</li>}
              {settings.phone2 && <li>{settings.phone2}</li>}
              {settings.email && <li>{settings.email}</li>}
            </ul>
          </div>
          <div>
            <div className="text-sm font-semibold text-ink">Shop</div>
            <ul className="mt-2 space-y-1 text-sm text-muted">
              <li><Link href="/products" className="hover:text-brand">All Products</Link></li>
              <li><Link href="/categories" className="hover:text-brand">Categories</Link></li>
              <li><Link href="/cart" className="hover:text-brand">Cart</Link></li>
            </ul>
            <p className="mt-4 text-xs text-muted">Flat delivery Rs {settings.deliveryFee} island-wide.</p>
          </div>
        </div>
        <div className="border-t border-line py-4 text-center text-xs text-muted">
          © {new Date().getFullYear()} {settings.shopName}. All rights reserved.
        </div>
      </footer>
    </CartProvider>
  );
}
