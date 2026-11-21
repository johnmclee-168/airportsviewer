/**
 * Shared test fixtures: a few raw upstream airport records (copied from the real
 * API) and their normalised counterparts.
 */
import { normalizeAirport } from "@/lib/airports/normalize";
import type { Airport, RawAirport } from "@/lib/airports/types";

export const rawSydney: RawAirport = {
  airportCode: "SYD",
  internationalAirport: true,
  domesticAirport: true,
  regionalAirport: false,
  onlineIndicator: true,
  eticketableAirport: true,
  location: {
    aboveSeaLevel: 21,
    latitude: 33.56,
    latitudeRadius: -0.5922,
    longitude: 151.1,
    longitudeRadius: 2.6384,
    latitudeDirection: "S",
    longitudeDirection: "E",
  },
  airportName: "Sydney (Kingsford Smith)",
  city: { cityCode: "SYD", cityName: "Sydney", timeZoneName: "Australia/Sydney" },
  state: {},
  country: { countryCode: "AU", countryName: "Australia" },
  region: { regionCode: "AU", regionName: "Australia" },
};

export const rawLondon: RawAirport = {
  airportCode: "LHR",
  internationalAirport: true,
  domesticAirport: false,
  regionalAirport: false,
  onlineIndicator: true,
  eticketableAirport: true,
  location: {
    aboveSeaLevel: 85,
    latitude: 51.28,
    latitudeRadius: 0.8983,
    longitude: 0.27,
    longitudeRadius: -0.0079,
    latitudeDirection: "N",
    longitudeDirection: "W",
  },
  airportName: "London (Heathrow)",
  city: { cityCode: "LON", cityName: "London", timeZoneName: "Europe/London" },
  state: {},
  country: { countryCode: "GB", countryName: "United Kingdom" },
  region: { regionCode: "EU", regionName: "Europe" },
};

export const rawArrabury: RawAirport = {
  airportCode: "AAB",
  internationalAirport: false,
  domesticAirport: false,
  regionalAirport: false,
  onlineIndicator: false,
  eticketableAirport: false,
  location: {
    aboveSeaLevel: -99999,
    latitude: 26.45,
    latitudeRadius: -0.4669,
    longitude: 141.0,
    longitudeRadius: 2.4609,
    latitudeDirection: "S",
    longitudeDirection: "E",
  },
  airportName: "Arrabury",
  city: { cityCode: "AAB", cityName: "Arrabury", timeZoneName: "Australia/Brisbane" },
  state: { stateCode: "QLD", stateName: "Queensland" },
  country: { countryCode: "AU", countryName: "Australia" },
  region: { regionCode: "AU", regionName: "Australia" },
};

/** A record with no coordinates and no city name, as seen in the real data. */
export const rawUnknownLocation: RawAirport = {
  airportCode: "ZZZ",
  internationalAirport: false,
  domesticAirport: false,
  regionalAirport: false,
  onlineIndicator: false,
  eticketableAirport: false,
  location: {
    aboveSeaLevel: -99999,
    latitude: 0,
    latitudeRadius: 0,
    longitude: 0,
    longitudeRadius: 0,
  },
  airportName: "Mystery Field",
  city: { cityCode: "ZZZ", timeZoneName: "UTC" },
  state: {},
  country: { countryCode: "XX", countryName: "Nowhere" },
  region: { regionCode: "XX", regionName: "Nowhere" },
};

export const rawAirports: RawAirport[] = [rawSydney, rawLondon, rawArrabury];

export const sydney: Airport = normalizeAirport(rawSydney);
export const london: Airport = normalizeAirport(rawLondon);
export const arrabury: Airport = normalizeAirport(rawArrabury);
export const airports: Airport[] = [arrabury, london, sydney];
