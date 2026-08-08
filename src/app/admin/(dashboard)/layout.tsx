import { redirect } from "next/navigation";
import Link from "next/link";
import { isAdmin } from "@/lib/auth";
import { AdminNav } from "@/components/admin-nav";

export const metadata = { title: "Admin", robots: { index: false } };

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Real session verification (Node runtime).
  if (!(await isAdmin())) redirect("/admin/login");

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto flex max-w-7xl flex-col md:flex-row">
        {/* Sidebar */}
        <aside className="border-b border-line bg-white md:min-h-screen md:w-60 md:border-b-0 md:border-r">
          <div className="flex items-center px-5 py-4">
            <Link href="/admin" className="text-lg font-bold text-ink">
              SpareX <span className="text-sm font-medium text-muted">Admin</span>
            </Link>
          </div>
          <div className="px-3 pb-4">
            <AdminNav />
          </div>
        </aside>

        {/* Content */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8">{children}</div>
      </div>
    </div>
  );
}
