"use client";
/**
 * LoadingScreen
 * Animated loader shown while airports are first fetched (the brief's
 * "Loading" wireframe). A plane orbits a pulsing globe above skeleton rows
 * that hint at the list to come. Because the full airport list is large, the
 * message escalates if loading takes a while so users know the app is still
 * working. Announced politely to screen readers via role="status".
 */
import { useEffect, useState } from "react";

export const SLOW_AFTER_MS = 3_000;
export const VERY_SLOW_AFTER_MS = 10_000;

export interface LoadingScreenProps {
  label?: string;
  /** Number of skeleton rows to show under the spinner. */
  skeletonRows?: number;
}

export function LoadingScreen({
  label = "Loading airports…",
  skeletonRows = 6,
}: LoadingScreenProps) {
  const [stage, setStage] = useState<0 | 1 | 2>(0);

  useEffect(() => {
    const slow = setTimeout(() => setStage(1), SLOW_AFTER_MS);
    const verySlow = setTimeout(() => setStage(2), VERY_SLOW_AFTER_MS);
    return () => {
      clearTimeout(slow);
      clearTimeout(verySlow);
    };
  }, []);

  const hint = [
    null,
    "Still working — there are thousands of airports to load.",
    "This is taking longer than usual. Hang tight, or check your connection.",
  ][stage];

  return (
    <div className="flex animate-fade-in flex-col gap-6">
      <div
        role="status"
        aria-live="polite"
        className="flex flex-col items-center gap-4 pt-8 text-center"
      >
        <PlaneSpinner />
        <p className="text-lg font-medium">{label}</p>
        <p className="min-h-[2.5rem] max-w-xs text-sm text-muted">
          {hint && <span className="block animate-fade-in-up">{hint}</span>}
        </p>
      </div>
      {skeletonRows > 0 && <SkeletonList rows={skeletonRows} />}
    </div>
  );
}

function PlaneSpinner() {
  return (
    <div aria-hidden="true" className="relative h-24 w-24">
      <div className="absolute inset-4 animate-pulse-soft rounded-full bg-brand-soft" />
      <svg viewBox="0 0 48 48" className="absolute inset-4 h-16 w-16 text-brand/40">
        <circle cx="24" cy="24" r="22" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <ellipse
          cx="24"
          cy="24"
          rx="10"
          ry="22"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path d="M2 24h44M6 13h36M6 35h36" fill="none" stroke="currentColor" strokeWidth="1.5" />
      </svg>
      <div className="absolute inset-0 animate-orbit">
        <svg
          viewBox="0 0 24 24"
          className="absolute top-0 left-1/2 h-7 w-7 -translate-x-1/2 rotate-90 fill-brand"
        >
          <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z" />
        </svg>
      </div>
    </div>
  );
}

export function SkeletonList({ rows }: { rows: number }) {
  return (
    <div
      aria-hidden="true"
      data-testid="skeleton-list"
      className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm"
    >
      {Array.from({ length: rows }, (_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-b-0"
          style={{ opacity: 1 - i * 0.12 }}
        >
          <div className="skeleton h-10 w-12 shrink-0 rounded-lg" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-4" style={{ width: `${60 - (i % 3) * 10}%` }} />
            <div className="skeleton h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
