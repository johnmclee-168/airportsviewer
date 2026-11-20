/**
 * Free-text airport search used by the list screen.
 * Matches (case/accent-insensitive) on airport code, name, city and country.
 */
import type { Airport } from "./types";

export function foldText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

export function filterAirports(airports: Airport[], query: string): Airport[] {
  const needle = foldText(query);
  if (!needle) return airports;
  return airports.filter((airport) => {
    if (airport.code.toLowerCase() === needle) return true;
    const haystack = foldText(
      `${airport.code} ${airport.name} ${airport.city.name} ${airport.country.name}`,
    );
    return haystack.includes(needle);
  });
}
