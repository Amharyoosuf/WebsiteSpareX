import Link from "next/link";

type HeroProduct = { slug: string; name: string; image: string };

export function Hero({ products }: { products: HeroProduct[] }) {
  const tiles = products.slice(0, 6);
  return (
    <section className="relative mb-8 overflow-hidden rounded-2xl border border-line bg-gradient-to-br from-[#d8e6ff] via-[#eef5ff] to-[#cfe0ff]">
      <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-brand/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-10 h-56 w-56 rounded-full bg-sky-mid/50 blur-3xl" />
      <div className="relative grid items-center gap-6 p-6 sm:p-8 lg:grid-cols-2 lg:gap-10 lg:p-12">
        {/* Text + actions */}
        <div>
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-ink sm:text-4xl lg:text-5xl">
            The best products <br className="hidden sm:block" />
            <span className="text-brand">at the best prices</span>
          </h1>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/products" className="btn-primary px-6">Shop All</Link>
            <Link href="/categories" className="btn-outline bg-white/70 px-6">
              Shop by Category
            </Link>
          </div>
        </div>

        {/* Product mix */}
        {tiles.length > 0 && (
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {tiles.map((p, i) => (
              <Link
                key={i}
                href={`/product/${p.slug}`}
                className="group relative aspect-square overflow-hidden rounded-xl border border-line bg-white shadow-card"
                aria-label={p.name}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.image}
                  alt={p.name}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
