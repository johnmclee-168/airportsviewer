/**
 * Converts raw upstream airport records into the `Airport` shape used by the UI.
 *
 * Data quirks handled here:
 * - Coordinates: `latitude`/`longitude` are unsigned DD.MM values, so we derive
 *   signed decimal degrees from the `*Radius` (radians) fields instead.
 *   Records with no direction and 0/0 radians have no known location.
 * - Elevation: -99999 is a sentinel for "unknown".
 * - City name / state are occasionally missing.
 */
import type { Airport, RawAirport } from "./types";

const UNKNOWN_ELEVATION = -99999;
const RAD_TO_DEG = 180 / Math.PI;

function round(value: number, decimals = 4): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function toLocation(location: RawAirport["location"]): Airport["location"] {
  const { latitudeRadius, longitudeRadius, latitudeDirection, longitudeDirection } = location;
  const hasDirection = Boolean(latitudeDirection && longitudeDirection);
  const isNullIsland = latitudeRadius === 0 && longitudeRadius === 0;
  if (!hasDirection && isNullIsland) return null;
  if (!Number.isFinite(latitudeRadius) || !Number.isFinite(longitudeRadius)) return null;
  return {
    latitude: round(latitudeRadius * RAD_TO_DEG),
    longitude: round(longitudeRadius * RAD_TO_DEG),
  };
}

export function normalizeAirport(raw: RawAirport): Airport {
  const elevation = raw.location?.aboveSeaLevel;
  return {
    code: raw.airportCode,
    name: raw.airportName,
    city: {
      code: raw.city.cityCode,
      name: raw.city.cityName ?? raw.airportName,
    },
    state:
      raw.state?.stateCode && raw.state.stateName
        ? { code: raw.state.stateCode, name: raw.state.stateName }
        : null,
    country: { code: raw.country.countryCode, name: raw.country.countryName },
    region: { code: raw.region.regionCode, name: raw.region.regionName },
    timezone: raw.city.timeZoneName,
    location: raw.location ? toLocation(raw.location) : null,
    elevationFt:
      typeof elevation === "number" && elevation !== UNKNOWN_ELEVATION ? elevation : null,
    international: raw.internationalAirport,
    domestic: raw.domesticAirport,
    regional: raw.regionalAirport,
    online: raw.onlineIndicator,
    eticketable: raw.eticketableAirport,
  };
}

/** Normalises and sorts airports alphabetically by name (then code). */
export function normalizeAirports(raw: RawAirport[]): Airport[] {
  return raw
    .filter((item) => item && typeof item.airportCode === "string")
    .map(normalizeAirport)
    .sort((a, b) => a.name.localeCompare(b.name) || a.code.localeCompare(b.code));
}
