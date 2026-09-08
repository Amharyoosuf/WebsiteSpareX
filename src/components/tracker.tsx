"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

type EventType = "view" | "product_view" | "add_to_cart";

function getVisitorId(): string {
  try {
    let id = localStorage.getItem("cs_vid");
    if (!id) {
      id = crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random();
      localStorage.setItem("cs_vid", id);
    }
    return id;
  } catch {
    return "";
  }
}

// Only "view" events consume the per-session "entry" flag, so the landing
// source is attributed once and later navigations count as Internal.
function consumeEntry(): boolean {
  try {
    if (sessionStorage.getItem("cs_entered")) return false;
    sessionStorage.setItem("cs_entered", "1");
    return true;
  } catch {
    return true;
  }
}

export function trackEvent(type: EventType, extra?: { productId?: string }) {
  try {
    const url = new URL(window.location.href);
    const payload = {
      type,
      path: url.pathname,
      referrer: document.referrer || "",
      utmSource: url.searchParams.get("utm_source") || "",
      entry: type === "view" ? consumeEntry() : false,
      productId: extra?.productId || null,
      visitorId: getVisitorId(),
    };
    const body = JSON.stringify(payload);
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      navigator.sendBeacon("/api/track", new Blob([body], { type: "application/json" }));
    } else {
      fetch("/api/track", {
        method: "POST",
        body,
        headers: { "Content-Type": "application/json" },
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    // never let tracking break the page
  }
}

// Records a page view on first load and on every client-side navigation.
export function PageTracker() {
  const pathname = usePathname();
  useEffect(() => {
    trackEvent("view");
  }, [pathname]);
  return null;
}

// Records a product view.
export function ProductViewTracker({ productId }: { productId: string }) {
  useEffect(() => {
    trackEvent("product_view", { productId });
  }, [productId]);
  return null;
}
