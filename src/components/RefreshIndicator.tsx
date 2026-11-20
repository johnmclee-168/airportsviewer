"use client";
/**
 * RefreshIndicator
 * Thin indeterminate progress bar pinned under the header while airports are
 * being refreshed in the background (data is already on screen, so a full
 * loading screen would be disruptive).
 */
import { useAirports } from "@/context/AirportsProvider";

export function RefreshIndicator() {
  const { isFetching, status } = useAirports();
  if (!isFetching || status !== "success") return null;
  return (
    <div
      role="progressbar"
      aria-label="Refreshing airports"
      className="fixed inset-x-0 top-14 z-30 h-0.5 overflow-hidden bg-brand-soft"
    >
      <div className="h-full w-full origin-left bg-brand animate-indeterminate" />
    </div>
  );
}
