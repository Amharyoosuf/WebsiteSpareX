import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatLKR } from "@/lib/money";
import { pct } from "@/lib/analytics";

export const dynamic = "force-dynamic";

const RANGES: Record<string, { label: string; days: number | null }> = {
  "7": { label: "7 days", days: 7 },
  "30": { label: "30 days", days: 30 },
  "90": { label: "90 days", days: 90 },
  all: { label: "All time", days: null },
};

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const { days } = await searchParams;
  const key = days && RANGES[days] ? days : "30";
  const range = RANGES[key];
  const since = range.days ? new Date(Date.now() - range.days * 86400000) : null;
  const dateFilter = since ? { gte: since } : undefined;
  const evWhere = (type: string) => ({ type, ...(dateFilter ? { createdAt: dateFilter } : {}) });
  const inRange = dateFilter ? { createdAt: dateFilter } : {};

  const [visits, productViews, addToCarts, orders, uniqueRows, sourceRows, viewedRows] =
    await Promise.all([
      prisma.analyticsEvent.count({ where: evWhere("view") }),
      prisma.analyticsEvent.count({ where: evWhere("product_view") }),
      prisma.analyticsEvent.count({ where: evWhere("add_to_cart") }),
      prisma.order.count({ where: inRange }),
      prisma.analyticsEvent.groupBy({
        by: ["visitorId"],
        where: { type: "view", visitorId: { not: null }, ...inRange },
      }),
      prisma.analyticsEvent.groupBy({
        by: ["source"],
        where: { type: "view", source: { not: "Internal" }, ...inRange },
        _count: { _all: true },
      }),
      prisma.analyticsEvent.groupBy({
        by: ["productId"],
        where: { type: "product_view", productId: { not: null }, ...inRange },
        _count: { _all: true },
      }),
    ]);

  const uniqueVisitors = uniqueRows.length;

  const sources = sourceRows
    .map((r) => ({ source: r.source, count: r._count._all }))
    .sort((a, b) => b.count - a.count);
  const sourcesTotal = sources.reduce((s, x) => s + x.count, 0);

  const viewedTop = viewedRows
    .map((r) => ({ productId: r.productId as string, count: r._count._all }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
  const viewedProducts = await prisma.product.findMany({
    where: { id: { in: viewedTop.map((v) => v.productId) } },
    select: { id: true, name: true, slug: true },
  });
  const pById = new Map(viewedProducts.map((p) => [p.id, p]));
  const topViewed = viewedTop.map((v) => ({
    count: v.count,
    name: pById.get(v.productId)?.name || "(deleted)",
    slug: pById.get(v.productId)?.slug,
  }));

  const ordersInRange = await prisma.order.findMany({
    where: inRange,
    select: { items: { select: { productName: true, qty: true, lineTotal: true } } },
  });
  const orderedMap = new Map<string, { qty: number; revenue: number }>();
  for (const o of ordersInRange)
    for (const it of o.items) {
      const cur = orderedMap.get(it.productName) || { qty: 0, revenue: 0 };
      cur.qty += it.qty;
      cur.revenue += it.lineTotal;
      orderedMap.set(it.productName, cur);
    }
  const topOrdered = [...orderedMap.entries()]
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 8);

  const stats = [
    { label: "Visits", value: visits.toLocaleString() },
    { label: "Unique visitors", value: uniqueVisitors.toLocaleString() },
    { label: "Product views", value: productViews.toLocaleString() },
    { label: "Add to cart", value: addToCarts.toLocaleString() },
    { label: "Orders", value: orders.toLocaleString() },
    { label: "Conversion", value: pct(orders, visits) },
  ];

  const funnel = [
    { label: "Product views → Add to cart", value: pct(addToCarts, productViews) },
    { label: "Add to cart → Order", value: pct(orders, addToCarts) },
    { label: "Visits → Order (overall)", value: pct(orders, visits) },
  ];

  const hasData = visits + productViews + addToCarts + orders > 0;

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold text-ink sm:text-2xl">Analytics</h1>
        <div className="flex flex-wrap gap-2">
          {Object.entries(RANGES).map(([k, r]) => (
            <Link
              key={k}
              href={`/admin/analytics?days=${k}`}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium ${
                k === key ? "bg-brand text-white" : "border border-line bg-white text-ink hover:bg-gray-50"
              }`}
            >
              {r.label}
            </Link>
          ))}
        </div>
      </div>

      {!hasData ? (
        <div className="card p-10 text-center text-muted">
          No analytics yet. Data starts appearing here as people visit the shop.
        </div>
      ) : (
        <div className="space-y-6">
          {/* Stat cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {stats.map((s) => (
              <div key={s.label} className="card p-4">
                <div className="text-xs font-medium uppercase tracking-wide text-muted">{s.label}</div>
                <div className="mt-1 text-xl font-bold text-ink">{s.value}</div>
              </div>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Traffic sources */}
            <section className="card p-5">
              <h2 className="mb-1 text-base font-bold text-ink">Traffic sources</h2>
              <p className="mb-4 text-xs text-muted">Where visitors arrived from (internal navigation excluded).</p>
              {sources.length === 0 ? (
                <p className="text-sm text-muted">No source data yet.</p>
              ) : (
                <ul className="space-y-2.5">
                  {sources.slice(0, 10).map((s) => (
                    <li key={s.source}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="font-medium text-ink">{s.source}</span>
                        <span className="text-muted">
                          {s.count} · {pct(s.count, sourcesTotal)}
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full bg-brand"
                          style={{ width: `${sourcesTotal ? (s.count / sourcesTotal) * 100 : 0}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Funnel / CTRs */}
            <section className="card p-5">
              <h2 className="mb-1 text-base font-bold text-ink">Funnel &amp; conversion</h2>
              <p className="mb-4 text-xs text-muted">Click-through and conversion rates for the period.</p>
              <ul className="space-y-3">
                {funnel.map((f) => (
                  <li key={f.label} className="flex items-center justify-between rounded-lg border border-line px-4 py-3">
                    <span className="text-sm text-ink">{f.label}</span>
                    <span className="text-lg font-bold text-brand">{f.value}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Most viewed */}
            <section className="card p-5">
              <h2 className="mb-4 text-base font-bold text-ink">Most viewed products</h2>
              {topViewed.length === 0 ? (
                <p className="text-sm text-muted">No product views yet.</p>
              ) : (
                <ol className="space-y-2">
                  {topViewed.map((p, i) => (
                    <li key={i} className="flex items-center justify-between text-sm">
                      <span className="min-w-0 truncate text-ink">
                        <span className="mr-2 text-muted">{i + 1}.</span>
                        {p.slug ? (
                          <Link href={`/product/${p.slug}`} target="_blank" className="hover:text-brand">
                            {p.name}
                          </Link>
                        ) : (
                          p.name
                        )}
                      </span>
                      <span className="ml-3 shrink-0 font-medium text-ink">{p.count} views</span>
                    </li>
                  ))}
                </ol>
              )}
            </section>

            {/* Most ordered */}
            <section className="card p-5">
              <h2 className="mb-4 text-base font-bold text-ink">Best sellers (by orders)</h2>
              {topOrdered.length === 0 ? (
                <p className="text-sm text-muted">No orders in this period.</p>
              ) : (
                <ol className="space-y-2">
                  {topOrdered.map((p, i) => (
                    <li key={i} className="flex items-center justify-between text-sm">
                      <span className="min-w-0 truncate text-ink">
                        <span className="mr-2 text-muted">{i + 1}.</span>
                        {p.name}
                      </span>
                      <span className="ml-3 shrink-0 font-medium text-ink">
                        {p.qty} sold · {formatLKR(p.revenue)}
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
