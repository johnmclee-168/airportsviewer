"use client";
/**
 * useOnlineStatus
 * Subscribes to the browser's online/offline events. Returns true during SSR
 * and hydration (we can't know yet), then the live navigator.onLine value.
 */
import { useSyncExternalStore } from "react";

function subscribe(onChange: () => void) {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}

export function useOnlineStatus(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true,
  );
}
