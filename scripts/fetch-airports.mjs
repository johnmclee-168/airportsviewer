#!/usr/bin/env node
/**
 * Snapshot the real Qantas airports endpoint into mocks/airports.json.
 *
 * The snapshot backs the local mock API (AIRPORTS_SOURCE=mock) so the app can be
 * developed and demoed without depending on the upstream service.
 *
 * Usage: npm run mock:refresh
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ENDPOINT = "https://api.qantas.com/flight/refData/airport";
const OUTPUT = resolve(dirname(fileURLToPath(import.meta.url)), "../mocks/airports.json");

const response = await fetch(ENDPOINT, { headers: { Accept: "application/json" } });
if (!response.ok) {
  console.error(`Request failed: ${response.status} ${response.statusText}`);
  process.exit(1);
}

const airports = await response.json();
if (!Array.isArray(airports)) {
  console.error("Unexpected payload: expected a JSON array of airports");
  process.exit(1);
}

await mkdir(dirname(OUTPUT), { recursive: true });
await writeFile(OUTPUT, JSON.stringify(airports));
console.log(`Saved ${airports.length} airports to ${OUTPUT}`);
