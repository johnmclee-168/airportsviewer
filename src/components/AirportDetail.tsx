"use client";
/**
 * AirportDetail
 * Presentational detail view for a single airport. Shows a hero header (code,
 * name, city, country, airport type badges) followed by cards for currency,
 * timezone (with live local time) and location (DMS + decimal coordinates,
 * elevation, region, Google Maps link). A full-width button returns to the list.
 * The page slides in from the right and the cards cascade in after it.
 */
import type { ReactNode } from "react";
import { useNow } from "@/hooks/useNow";
import { getCurrencyInfo } from "@/lib/airports/currency";
import {
  formatElevation,
  formatLatitude,
  formatLongitude,
  getTimezoneInfo,
  googleMapsUrl,
} from "@/lib/airports/format";
import type { Airport } from "@/lib/airports/types";

export interface AirportDetailProps {
  airport: Airport;
  onBack: () => void;
}

export function AirportDetail({ airport, onBack }: AirportDetailProps) {
  const now = useNow();
  const currency = getCurrencyInfo(airport.country.code);
  const timezone = getTimezoneInfo(airport.timezone, now);
  const badges = [
    airport.international && "International",
    airport.domestic && "Domestic",
    airport.regional && "Regional",
    airport.eticketable && "E-ticketing",
  ].filter((badge): badge is string => Boolean(badge));
  const place = [
    airport.city.name !== airport.name ? airport.city.name : null,
    airport.state?.name,
    airport.country.name,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <article aria-labelledby="airport-name" className="flex animate-slide-in-right flex-col gap-4">
      <BackLink onBack={onBack} />

      <header className="overflow-hidden rounded-2xl bg-brand text-white shadow-md">
        <div className="flex items-start gap-4 p-5 sm:p-6">
          <div className="flex h-16 w-20 shrink-0 items-center justify-center rounded-xl bg-white/15 font-mono text-2xl font-bold tracking-wider">
            {airport.code}
          </div>
          <div className="min-w-0">
            <h1 id="airport-name" className="text-2xl leading-tight font-semibold tracking-tight">
              {airport.name}
            </h1>
            <p className="mt-1 text-white/85">{place}</p>
          </div>
        </div>
        {badges.length > 0 && (
          <ul aria-label="Airport type" className="flex flex-wrap gap-2 px-5 pb-5 sm:px-6">
            {badges.map((badge) => (
              <li key={badge} className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
                {badge}
              </li>
            ))}
          </ul>
        )}
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <DetailCard title="Currency" icon={<CurrencyIcon />} enterDelayMs={80}>
          {currency ? (
            <>
              <p className="text-3xl font-semibold">
                {currency.symbol !== currency.code && (
                  <span className="mr-2 text-brand">{currency.symbol}</span>
                )}
                {currency.code}
              </p>
              <p className="mt-1 text-muted">{currency.name}</p>
            </>
          ) : (
            <p className="text-muted">No official currency</p>
          )}
        </DetailCard>

        <DetailCard title="Timezone" icon={<ClockIcon />} enterDelayMs={140}>
          <p className="text-3xl font-semibold" aria-label="Local time">
            {timezone.localTime?.split(", ").pop() ?? "—"}
          </p>
          <p className="mt-1 text-muted">
            {timezone.localTime?.split(", ").slice(0, -1).join(", ")}
            {timezone.offset && ` · ${timezone.offset}`}
          </p>
          <p className="mt-2 font-mono text-sm break-all">{timezone.id}</p>
        </DetailCard>

        <DetailCard
          title="Location"
          icon={<PinIcon />}
          className="sm:col-span-2"
          enterDelayMs={200}
        >
          {airport.location ? (
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
              <Field label="Latitude" value={formatLatitude(airport.location.latitude)} />
              <Field label="Longitude" value={formatLongitude(airport.location.longitude)} />
              <Field label="Elevation" value={formatElevation(airport.elevationFt)} />
              <Field label="Region" value={airport.region.name} />
            </dl>
          ) : (
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
              <Field label="Coordinates" value="Not available" />
              <Field label="Region" value={airport.region.name} />
            </dl>
          )}
          {airport.location && (
            <a
              href={googleMapsUrl(airport.location.latitude, airport.location.longitude)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline"
            >
              Open in Google Maps
              <span aria-hidden="true">↗</span>
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          )}
        </DetailCard>
      </div>

      <button
        type="button"
        onClick={onBack}
        className="mt-2 h-12 w-full rounded-xl bg-foreground font-medium text-background shadow-sm transition-transform active:scale-[0.98] sm:mx-auto sm:w-64"
      >
        Back to airports
      </button>
    </article>
  );
}

function BackLink({ onBack }: { onBack: () => void }) {
  return (
    <button
      type="button"
      onClick={onBack}
      className="-ml-2 flex w-fit items-center gap-1 rounded-lg px-2 py-1 text-sm font-medium text-brand hover:bg-brand-soft"
    >
      <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4 fill-current">
        <path d="M12.7 4.3a1 1 0 0 1 0 1.4L8.4 10l4.3 4.3a1 1 0 0 1-1.4 1.4l-5-5a1 1 0 0 1 0-1.4l5-5a1 1 0 0 1 1.4 0z" />
      </svg>
      All airports
    </button>
  );
}

function DetailCard({
  title,
  icon,
  className = "",
  enterDelayMs = 0,
  children,
}: {
  title: string;
  icon: ReactNode;
  className?: string;
  enterDelayMs?: number;
  children: ReactNode;
}) {
  return (
    <section
      aria-label={title}
      className={`animate-fade-in-up rounded-2xl border border-border bg-surface p-5 shadow-sm ${className}`}
      style={{ animationDelay: `${enterDelayMs}ms` }}
    >
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold tracking-wide text-muted uppercase">
        <span className="text-brand">{icon}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

const iconClass = "h-4 w-4 fill-none stroke-current stroke-2";

function CurrencyIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={iconClass}>
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={iconClass}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={iconClass}>
      <path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </svg>
  );
}
