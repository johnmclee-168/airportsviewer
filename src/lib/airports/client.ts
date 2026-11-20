/**
 * Browser-side fetcher for the app's own /api/airports endpoint.
 *
 * Every failure is converted into an `AirportsError` with a `kind`, so the UI
 * can show a specific, human-friendly message (offline vs. timeout vs. server
 * error) instead of a raw exception.
 */
import type { Airport } from "./types";

export const AIRPORTS_ENDPOINT = "/api/airports";
export const REQUEST_TIMEOUT_MS = 20_000;

export type AirportsErrorKind = "offline" | "timeout" | "network" | "server" | "invalid";

const FRIENDLY_MESSAGES: Record<AirportsErrorKind, { title: string; message: string }> = {
  offline: {
    title: "You're offline",
    message: "Check your internet connection. We'll try again as soon as you're back online.",
  },
  timeout: {
    title: "This is taking too long",
    message: "The airports service didn't respond in time. Please try again.",
  },
  network: {
    title: "Can't reach the server",
    message: "We couldn't connect to load airports. Please check your connection and try again.",
  },
  server: {
    title: "Airports are unavailable",
    message: "The airports service is having trouble right now. Please try again shortly.",
  },
  invalid: {
    title: "Something went wrong",
    message: "We received an unexpected response while loading airports. Please try again.",
  },
};

export class AirportsError extends Error {
  readonly title: string;

  constructor(
    readonly kind: AirportsErrorKind,
    /** Technical detail, useful for support/debugging. */
    readonly detail?: string,
    readonly status?: number,
  ) {
    super(FRIENDLY_MESSAGES[kind].message);
    this.name = "AirportsError";
    this.title = FRIENDLY_MESSAGES[kind].title;
  }
}

function isOffline(): boolean {
  return typeof navigator !== "undefined" && navigator.onLine === false;
}

export async function fetchAirports(signal?: AbortSignal): Promise<Airport[]> {
  if (isOffline()) throw new AirportsError("offline");

  const timeout = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
  const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;

  let response: Response;
  try {
    response = await fetch(AIRPORTS_ENDPOINT, {
      signal: combined,
      headers: { Accept: "application/json" },
    });
  } catch (error) {
    // A caller-initiated abort is not an error the UI should report.
    if (signal?.aborted) throw error;
    if (timeout.aborted) throw new AirportsError("timeout");
    if (isOffline()) throw new AirportsError("offline");
    throw new AirportsError("network", error instanceof Error ? error.message : String(error));
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new AirportsError(
      "server",
      body?.error ?? `HTTP ${response.status} ${response.statusText}`.trim(),
      response.status,
    );
  }

  const body = (await response.json().catch(() => null)) as { airports?: unknown } | null;
  if (!body || !Array.isArray(body.airports)) {
    throw new AirportsError("invalid", "Response did not contain an airports array");
  }
  return body.airports as Airport[];
}

/** Normalises any thrown value into an AirportsError for display. */
export function toAirportsError(error: unknown): AirportsError {
  if (error instanceof AirportsError) return error;
  return new AirportsError("invalid", error instanceof Error ? error.message : String(error));
}
