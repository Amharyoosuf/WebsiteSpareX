"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/admin/login/actions";

const links = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/settings", label: "Settings" },
];

export function AdminNav() {
  const pathname = usePathname();
  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  return (
    <nav className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            isActive(l.href, l.exact)
              ? "bg-brand text-white"
              : "text-ink hover:bg-gray-100"
          }`}
        >
          {l.label}
        </Link>
      ))}
      <div className="my-2 hidden border-t border-line md:block" />
      <Link href="/" target="_blank" className="whitespace-nowrap rounded-lg px-3 py-2 text-sm text-muted hover:bg-gray-100">
        View shop ↗
      </Link>
      <form action={logoutAction}>
        <button type="submit" className="w-full whitespace-nowrap rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50">
          Log out
        </button>
      </form>
    </nav>
  );
}
