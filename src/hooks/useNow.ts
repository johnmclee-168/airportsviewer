"use client";
/**
 * useNow
 * Returns the current Date, refreshed every `intervalMs` (default 30s), so
 * time-based UI such as an airport's local clock stays current.
 */
import { useEffect, useState } from "react";

export function useNow(intervalMs = 30_000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
