/**
 * Browser-side fetcher for the app's own /api/airports endpoint.
 */
import type { Airport } from "./types";

export const AIRPORTS_ENDPOINT = "/api/airports";

export async function fetchAirports(signal?: AbortSignal): Promise<Airport[]> {
  const response = await fetch(AIRPORTS_ENDPOINT, {
    signal,
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
  const body = (await response.json()) as { airports?: unknown };
  if (!Array.isArray(body.airports)) {
    throw new Error("Unexpected response from the airports service");
  }
  return body.airports as Airport[];
}
