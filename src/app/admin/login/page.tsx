"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { loginAction } from "./actions";

export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const res = await loginAction(null, fd);
    if (res.ok) {
      router.push("/admin");
      router.refresh();
    } else {
      setError(res.error || "Login failed.");
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-bold text-ink">Ceylon Spares Admin</h1>
          <p className="text-sm text-muted">Sign in to manage your shop.</p>
        </div>
        <form onSubmit={onSubmit} className="card p-6">
          <label className="label" htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            className="input"
            autoFocus
            required
          />
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          <button type="submit" className="btn-primary mt-4 w-full" disabled={loading}>
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm">
          <Link href="/" className="text-muted hover:text-brand">← Back to shop</Link>
        </p>
      </div>
    </div>
  );
}
