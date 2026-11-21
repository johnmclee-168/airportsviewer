/**
 * Server-side airport data source used by the /api/airports route handler.
 *
 * Selects where airports come from via the AIRPORTS_SOURCE env var:
 * - "live" (default): the real Qantas endpoint, memoised in memory for CACHE_TTL_MS
 * - "mock": the local snapshot in mocks/airports.json (see `npm run mock:refresh`)
 *
 * AIRPORTS_MOCK_DELAY_MS adds artificial latency (handy for checking the loader).
 * AIRPORTS_SIMULATE_FAILURE=1 makes every request fail with a 503 (to exercise
 * the API-failure UI without touching the network).
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { normalizeAirports } from "./normalize";
import type { Airport, RawAirport } from "./types";

export const QANTAS_AIRPORTS_URL = "https://api.qantas.com/flight/refData/airport";
const CACHE_TTL_MS = 60 * 60 * 1000;
const UPSTREAM_TIMEOUT_MS = 15_000;

export type AirportSource = "live" | "mock";

/** Environment variables (AIRPORTS_*) the data source reads. */
export type SourceEnv = Record<string, string | undefined>;

export class UpstreamError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "UpstreamError";
  }
}

let memo: { airports: Airport[]; expiresAt: number } | null = null;

export function resolveSource(env: SourceEnv = process.env): AirportSource {
  return env.AIRPORTS_SOURCE === "mock" ? "mock" : "live";
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function loadMock(): Promise<RawAirport[]> {
  const file = path.join(process.cwd(), "mocks", "airports.json");
  return JSON.parse(await readFile(file, "utf8")) as RawAirport[];
}

async function loadLive(): Promise<RawAirport[]> {
  let response: Response;
  try {
    response = await fetch(QANTAS_AIRPORTS_URL, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
      cache: "no-store",
    });
  } catch (cause) {
    throw new UpstreamError(`Could not reach the airports service: ${String(cause)}`);
  }
  if (!response.ok) {
    throw new UpstreamError(`Airports service responded with ${response.status}`, response.status);
  }
  const body: unknown = await response.json().catch(() => null);
  if (!Array.isArray(body)) {
    throw new UpstreamError("Airports service returned an unexpected payload");
  }
  return body as RawAirport[];
}

export async function getAirports(env: SourceEnv = process.env): Promise<Airport[]> {
  const source = resolveSource(env);
  const mockDelay = Number(env.AIRPORTS_MOCK_DELAY_MS ?? 0);
  if (mockDelay > 0) await delay(mockDelay);
  if (env.AIRPORTS_SIMULATE_FAILURE === "1") {
    throw new UpstreamError("Simulated failure (AIRPORTS_SIMULATE_FAILURE=1)", 503);
  }

  if (source === "mock") return normalizeAirports(await loadMock());

  if (memo && memo.expiresAt > Date.now()) return memo.airports;
  const airports = normalizeAirports(await loadLive());
  memo = { airports, expiresAt: Date.now() + CACHE_TTL_MS };
  return airports;
}

/** Test helper: forget the in-memory upstream cache. */
export function resetAirportsMemo(): void {
  memo = null;
}
