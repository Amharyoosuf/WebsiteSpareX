import "server-only";
import crypto from "crypto";
import { cookies } from "next/headers";
import { ADMIN_COOKIE } from "./constants";

const SECRET = process.env.SESSION_SECRET || "insecure-dev-secret";

// Signed token: base64(payload).hmac  — payload just marks an authenticated admin.
function sign(payload: string): string {
  const h = crypto.createHmac("sha256", SECRET).update(payload).digest("base64url");
  return `${Buffer.from(payload).toString("base64url")}.${h}`;
}

function verify(token: string | undefined): boolean {
  if (!token) return false;
  const [b64, mac] = token.split(".");
  if (!b64 || !mac) return false;
  let payload: string;
  try {
    payload = Buffer.from(b64, "base64url").toString();
  } catch {
    return false;
  }
  const expected = crypto.createHmac("sha256", SECRET).update(payload).digest("base64url");
  // Constant-time compare.
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function checkPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD || "";
  if (!expected) return false;
  const a = Buffer.from(password || "");
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export async function createAdminSession() {
  const token = sign(`admin:${Date.now()}`);
  const store = await cookies();
  store.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

export async function destroyAdminSession() {
  const store = await cookies();
  store.delete(ADMIN_COOKIE);
}

export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  return verify(store.get(ADMIN_COOKIE)?.value);
}

// For use in middleware (no next/headers access there).
export function verifyToken(token: string | undefined): boolean {
  return verify(token);
}
