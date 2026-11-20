"use client";
/**
 * ErrorState
 * Friendly, accessible error panel used when airports fail to load. Shows a
 * kind-specific icon, title and message (from AirportsError), an optional
 * expandable technical detail, a Retry button, and optional extra actions.
 */
import type { ReactNode } from "react";
import type { AirportsError } from "@/lib/airports/client";

export interface ErrorStateProps {
  error: AirportsError;
  onRetry: () => void;
  children?: ReactNode;
}

export function ErrorState({ error, onRetry, children }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex animate-fade-in-up flex-col items-center gap-3 rounded-2xl border border-border bg-surface px-6 py-10 text-center shadow-sm"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-soft text-brand">
        {error.kind === "offline" ? <OfflineIcon /> : <WarningIcon />}
      </div>
      <h2 className="text-xl font-semibold">{error.title}</h2>
      <p className="max-w-sm text-muted">{error.message}</p>
      {error.detail && (
        <details className="max-w-sm text-sm text-muted">
          <summary className="cursor-pointer select-none">Technical details</summary>
          <p className="mt-1 font-mono break-words">
            {error.status ? `${error.status}: ` : ""}
            {error.detail}
          </p>
        </details>
      )}
      <div className="mt-2 flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={onRetry}
          className="h-11 rounded-xl bg-brand px-6 font-medium text-white shadow-sm transition-colors hover:bg-brand-strong active:scale-[0.98]"
        >
          Try again
        </button>
        {children}
      </div>
    </div>
  );
}

const iconClass = "h-7 w-7 fill-none stroke-current stroke-2";

function WarningIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={iconClass}>
      <path d="M12 3 2 20h20L12 3z" strokeLinejoin="round" />
      <path d="M12 10v4M12 17h.01" strokeLinecap="round" />
    </svg>
  );
}

function OfflineIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={iconClass}>
      <path
        d="M2 8.5a15 15 0 0 1 20 0M5 12a10 10 0 0 1 14 0M8.5 15.5a5 5 0 0 1 7 0"
        strokeLinecap="round"
      />
      <path d="M12 19h.01M3 3l18 18" strokeLinecap="round" />
    </svg>
  );
}
