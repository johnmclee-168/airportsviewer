"use client";
/**
 * ServiceWorkerRegistrar
 * Registers /sw.js in production builds so the app shell (HTML, JS, CSS) is
 * cached and the app can be reopened without a network connection. Skipped in
 * development, where a caching service worker would fight hot reloading.
 */
import { useEffect } from "react";

export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch((error: unknown) => {
      console.warn("Service worker registration failed", error);
    });
  }, []);
  return null;
}
