"use client";
/**
 * Route error boundary
 * Catches unexpected rendering errors anywhere below the root layout and shows
 * a recoverable message instead of a blank screen.
 */
import { useEffect } from "react";

export default function RouteError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-surface px-6 py-12 text-center"
    >
      <h1 className="text-xl font-semibold">Something went wrong</h1>
      <p className="max-w-sm text-muted">An unexpected error occurred while showing this page.</p>
      <button
        type="button"
        onClick={() => retry()}
        className="mt-2 h-11 rounded-xl bg-brand px-6 font-medium text-white hover:bg-brand-strong"
      >
        Try again
      </button>
    </div>
  );
}
