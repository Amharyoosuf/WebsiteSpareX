"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Category = { id: string; name: string; slug: string };

export function CategoryBar({ categories }: { categories: Category[] }) {
  const pathname = usePathname();
  if (!categories.length) return null;

  const cls = (active: boolean) =>
    `whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
      active
        ? "bg-brand text-white shadow-sm"
        : "border border-line bg-white text-ink hover:border-brand hover:text-brand"
    }`;

  return (
    <div className="z-30 border-b border-line bg-white/90 backdrop-blur md:sticky md:top-16">
      <div className="container-page">
        <nav className="no-scrollbar flex gap-2 overflow-x-auto py-2.5">
          <Link href="/products" className={cls(pathname === "/products")}>
            All
          </Link>
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/category/${c.slug}`}
              className={cls(pathname === `/category/${c.slug}`)}
            >
              {c.name}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
