"use client";
/**
 * ConnectivityBanner
 * Slim status bar explaining when the app is showing saved (cached) airports:
 * either because the device is offline, or because the latest refresh failed.
 * Offers a retry when online. Renders nothing while everything is fresh.
 */
import { useAirports } from "@/context/AirportsProvider";
import { useNow } from "@/hooks/useNow";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { formatRelativeTime } from "@/lib/time";

export function ConnectivityBanner() {
  const online = useOnlineStatus();
  const { dataSource, savedAt, refreshError, isFetching, reload } = useAirports();
  const showingCache = dataSource === "cache" && savedAt !== null;

  if (online && !(refreshError && showingCache)) return null;

  return (
    <div
      role="status"
      className="mb-3 flex items-center gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100"
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 shrink-0 fill-none stroke-current stroke-2">
        <path d="M2 8.5a15 15 0 0 1 20 0M5 12a10 10 0 0 1 14 0M8.5 15.5a5 5 0 0 1 7 0" strokeLinecap="round" />
        <path d="M12 19h.01" strokeLinecap="round" />
        {!online && <path d="M3 3l18 18" strokeLinecap="round" />}
      </svg>
      <p className="flex-1">
        {online ? "Couldn't refresh airports." : "You're offline."}
        {savedAt !== null && (
          <>
            {" "}
            Showing airports saved <SavedAgo timestamp={savedAt} />.
          </>
        )}
      </p>
      {online && (
        <button
          type="button"
          onClick={reload}
          disabled={isFetching}
          className="shrink-0 rounded-lg px-2 py-1 font-medium underline disabled:opacity-50"
        >
          {isFetching ? "Retrying…" : "Retry"}
        </button>
      )}
    </div>
  );
}

/** Relative "saved …" time; only mounted while the banner is visible (it reads the clock). */
function SavedAgo({ timestamp }: { timestamp: number }) {
  const now = useNow(60_000).getTime();
  return <time dateTime={new Date(timestamp).toISOString()}>{formatRelativeTime(timestamp, now)}</time>;
}
