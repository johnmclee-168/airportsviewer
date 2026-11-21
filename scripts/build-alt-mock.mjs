#!/usr/bin/env node
/**
 * Build mocks/airports-alt.json, the alternative dataset for the Express mock API.
 *
 * It is deliberately easy to tell apart from the full snapshot in the UI:
 * - only Australian and New Zealand airports (578 rather than 7,189), so the
 *   list header count changes;
 * - every airport name ends with " (alt)".
 *
 * Re-run after `npm run mock:refresh` to rebuild it from the new snapshot.
 *
 * Usage: npm run mock:build-alt
 */
import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const MOCKS = resolve(dirname(fileURLToPath(import.meta.url)), "../mocks");
const SOURCE = resolve(MOCKS, "airports.json");
const OUTPUT = resolve(MOCKS, "airports-alt.json");
const COUNTRIES = new Set(["AU", "NZ"]);
const SUFFIX = " (alt)";

const airports = JSON.parse(await readFile(SOURCE, "utf8"));
const alt = airports
  .filter((airport) => COUNTRIES.has(airport.country?.countryCode))
  .map((airport) => ({ ...airport, airportName: `${airport.airportName}${SUFFIX}` }));

// Pretty-printed like the main snapshot, so it is already Prettier-clean.
await writeFile(OUTPUT, `${JSON.stringify(alt, null, 2)}\n`);
console.log(`Saved ${alt.length} of ${airports.length} airports to ${OUTPUT}`);
