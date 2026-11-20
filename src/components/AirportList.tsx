"use client";
/**
 * AirportList
 * The master screen. Reads airports from AirportsProvider and renders a
 * searchable list of AirportListItem rows. With ~7,000 airports it renders
 * results in pages (auto-extended by an IntersectionObserver sentinel, with a
 * "Show more" button fallback). Tapping a row opens its detail page and marks it
 * as selected; the selection is highlighted and scrolled back into view when
 * the user returns.
 */
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useAirports } from "@/context/AirportsProvider";
import { filterAirports } from "@/lib/airports/filter";
import type { Airport } from "@/lib/airports/types";
import { AirportListItem } from "./AirportListItem";
import { ErrorState } from "./ErrorState";
import { LoadingScreen } from "./LoadingScreen";
import { SearchBox } from "./SearchBox";

export const PAGE_SIZE = 50;
const STAGGERED_ROWS = 12;
const STAGGER_STEP_MS = 25;

/** Rows cascade in as each page appears; rows beyond the first dozen appear at once. */
function staggerDelay(index: number): number {
  const positionInPage = index % PAGE_SIZE;
  return positionInPage < STAGGERED_ROWS ? positionInPage * STAGGER_STEP_MS : 0;
}

export function AirportList() {
  const { status, airports, error, reload, selectedCode, selectAirport, query, setQuery } =
    useAirports();
  const deferredQuery = useDeferredValue(query);
  const results = useMemo(() => filterAirports(airports, deferredQuery), [airports, deferredQuery]);

  const handleSelect = useCallback(
    (airport: Airport) => selectAirport(airport.code),
    [selectAirport],
  );

  if (status === "loading") {
    return <LoadingScreen />;
  }

  if (status === "error" && error) {
    return <ErrorState error={error} onRetry={reload} />;
  }

  return (
    <section aria-labelledby="airports-heading" className="flex animate-fade-in flex-col gap-3">
      <div className="flex items-baseline justify-between gap-2">
        <h1 id="airports-heading" className="text-2xl font-semibold tracking-tight">
          Airports
        </h1>
        <p className="text-sm text-muted" aria-live="polite">
          {deferredQuery.trim()
            ? `${results.length.toLocaleString()} of ${airports.length.toLocaleString()}`
            : `${airports.length.toLocaleString()} airports`}
        </p>
      </div>
      <SearchBox value={query} onChange={setQuery} />
      {results.length === 0 ? (
        <p className="rounded-2xl border border-border bg-surface px-4 py-10 text-center text-muted">
          No airports match “{deferredQuery.trim()}”.
        </p>
      ) : (
        <AirportResults
          key={deferredQuery}
          results={results}
          selectedCode={selectedCode}
          onSelect={handleSelect}
        />
      )}
    </section>
  );
}

interface AirportResultsProps {
  results: Airport[];
  selectedCode: string | null;
  onSelect: (airport: Airport) => void;
}

/** Paged rendering of the filtered results. Remounted (via key) when the query changes. */
function AirportResults({ results, selectedCode, onSelect }: AirportResultsProps) {
  const [limit, setLimit] = useState(() => {
    // Make sure a previously selected airport is rendered so it can be scrolled to.
    const selectedIndex = selectedCode ? results.findIndex((a) => a.code === selectedCode) : -1;
    return Math.max(PAGE_SIZE, selectedIndex + PAGE_SIZE / 2);
  });
  const listRef = useRef<HTMLUListElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const hasMore = limit < results.length;
  const showMore = useCallback(() => setLimit((n) => n + PAGE_SIZE), []);

  // Bring the remembered selection back into view (e.g. after returning from details).
  useEffect(() => {
    const selected = listRef.current?.querySelector<HTMLElement>('[aria-current="true"]');
    selected?.scrollIntoView?.({ block: "center" });
    // Only on mount: later selections are made by the user, who can already see the row.
  }, []);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!hasMore || !sentinel || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) showMore();
      },
      { rootMargin: "600px 0px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, showMore]);

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
      <ul ref={listRef} aria-label="Airports" className="divide-y divide-border">
        {results.slice(0, limit).map((airport, index) => (
          <AirportListItem
            key={airport.code}
            airport={airport}
            selected={airport.code === selectedCode}
            onSelect={onSelect}
            enterDelayMs={staggerDelay(index)}
          />
        ))}
      </ul>
      {hasMore && (
        <div ref={sentinelRef} className="border-t border-border p-3 text-center">
          <button
            type="button"
            onClick={showMore}
            className="rounded-full px-4 py-2 text-sm font-medium text-brand hover:bg-brand-soft"
          >
            Show more ({(results.length - limit).toLocaleString()} remaining)
          </button>
        </div>
      )}
    </div>
  );
}
