"use client";
/**
 * AirportListItem
 * One row in the airport list: airport name and country (as per the brief),
 * with the IATA code and city as secondary detail. The row is a full-width
 * link to the airport detail page; the last tapped row is highlighted and
 * marked aria-current so it stands out when the user returns to the list.
 */
import Link from "next/link";
import { memo } from "react";
import type { Airport } from "@/lib/airports/types";

export interface AirportListItemProps {
  airport: Airport;
  selected: boolean;
  onSelect: (airport: Airport) => void;
  /** Entrance animation delay, used to cascade rows in. */
  enterDelayMs?: number;
}

function AirportListItemComponent({
  airport,
  selected,
  onSelect,
  enterDelayMs = 0,
}: AirportListItemProps) {
  return (
    <li className="animate-fade-in-up" style={{ animationDelay: `${enterDelayMs}ms` }}>
      <Link
        href={`/airports/${encodeURIComponent(airport.code)}`}
        onClick={() => onSelect(airport)}
        aria-current={selected ? "true" : undefined}
        data-code={airport.code}
        className={[
          "group flex w-full items-center gap-3 border-l-4 px-4 py-3 text-left transition-colors duration-200",
          "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand",
          selected
            ? "border-brand bg-brand-soft"
            : "border-transparent hover:bg-background active:bg-brand-soft",
        ].join(" ")}
      >
        <span
          className={[
            "flex h-10 w-12 shrink-0 items-center justify-center rounded-lg font-mono text-sm font-semibold transition-colors duration-200",
            selected ? "bg-brand text-white" : "bg-background text-foreground",
          ].join(" ")}
        >
          {airport.code}
        </span>
        <span className="min-w-0 flex-1">
          <span className={`block truncate ${selected ? "font-semibold" : "font-medium"}`}>
            {airport.name}
          </span>
          <span className="block truncate text-sm text-muted">
            {airport.city.name !== airport.name ? `${airport.city.name}, ` : ""}
            {airport.country.name}
          </span>
        </span>
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          className="h-5 w-5 shrink-0 fill-current text-muted transition-transform group-hover:translate-x-0.5"
        >
          <path d="M7.3 4.3a1 1 0 0 1 1.4 0l5 5a1 1 0 0 1 0 1.4l-5 5a1 1 0 1 1-1.4-1.4L11.6 10 7.3 5.7a1 1 0 0 1 0-1.4z" />
        </svg>
      </Link>
    </li>
  );
}

export const AirportListItem = memo(AirportListItemComponent);
