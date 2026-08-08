"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "./cart";

type Category = { id: string; name: string; slug: string };

export function SiteHeader({
  shopName,
  categories,
}: {
  shopName: string;
  categories: Category[];
}) {
  const [open, setOpen] = useState(false);
  const { count, ready } = useCart();

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur">
        <div className="container-page flex h-16 items-center gap-3">
          <button
            aria-label="Open menu"
            onClick={() => setOpen(true)}
            className="btn-ghost -ml-2 px-2"
          >
            <MenuIcon />
            <span className="hidden text-sm font-medium sm:inline">Menu</span>
          </button>

          <Link href="/" className="flex items-center">
            <span className="text-base font-bold tracking-tight text-ink sm:text-lg">{shopName}</span>
          </Link>

          <form action="/search" className="ml-auto hidden max-w-sm flex-1 md:block">
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                name="q"
                placeholder="Search parts…"
                className="input pl-9"
                autoComplete="off"
              />
            </div>
          </form>

          <Link href="/cart" className="btn-ghost relative ml-auto px-2 md:ml-0" aria-label="Cart">
            <CartIcon />
            <span className="hidden text-sm font-medium sm:inline">Cart</span>
            {ready && count > 0 && (
              <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1 text-[11px] font-bold text-white">
                {count}
              </span>
            )}
          </Link>
        </div>

        {/* Mobile search row */}
        <div className="container-page pb-3 md:hidden">
          <form action="/search">
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input type="search" name="q" placeholder="Search parts…" className="input pl-9" />
            </div>
          </form>
        </div>
      </header>

      {/* Category drawer */}
      {open && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <nav className="absolute left-0 top-0 h-full w-80 max-w-[85%] overflow-y-auto bg-white shadow-pop">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <span className="text-base font-bold">Categories</span>
              <button aria-label="Close menu" onClick={() => setOpen(false)} className="btn-ghost px-2">
                <CloseIcon />
              </button>
            </div>
            <ul className="p-2">
              <li>
                <Link
                  href="/"
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-4 py-3 text-sm font-semibold hover:bg-brand-light"
                >
                  All Products
                </Link>
              </li>
              {categories.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/category/${c.slug}`}
                    onClick={() => setOpen(false)}
                    className="block rounded-lg px-4 py-3 text-sm text-ink hover:bg-brand-light"
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
              {categories.length === 0 && (
                <li className="px-4 py-3 text-sm text-muted">No categories yet.</li>
              )}
            </ul>
          </nav>
        </div>
      )}
    </>
  );
}

function MenuIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}
function CloseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
function CartIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  );
}
function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" />
    </svg>
  );
}
