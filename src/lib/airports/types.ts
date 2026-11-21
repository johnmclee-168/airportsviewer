/**
 * Airport types.
 *
 * `RawAirport` mirrors the upstream https://api.qantas.com/flight/refData/airport
 * payload. `Airport` is the trimmed, normalised shape the UI consumes.
 */

export interface RawAirport {
  airportCode: string;
  airportName: string;
  internationalAirport: boolean;
  domesticAirport: boolean;
  regionalAirport: boolean;
  onlineIndicator: boolean;
  eticketableAirport: boolean;
  location: {
    /** Feet above sea level; -99999 means unknown. */
    aboveSeaLevel?: number;
    /** Degrees in DD.MM (degrees.minutes) notation, always positive. */
    latitude: number;
    longitude: number;
    /** Signed latitude/longitude in radians. */
    latitudeRadius: number;
    longitudeRadius: number;
    latitudeDirection?: "N" | "S";
    longitudeDirection?: "E" | "W";
  };
  city: { cityCode: string; cityName?: string; timeZoneName: string };
  state: { stateCode?: string; stateName?: string };
  country: { countryCode: string; countryName: string };
  region: { regionCode: string; regionName: string };
  preferredInternationalAirportCode?: string;
}

export interface NamedCode {
  code: string;
  name: string;
}

export interface Airport {
  code: string;
  name: string;
  city: NamedCode;
  state: NamedCode | null;
  country: NamedCode;
  region: NamedCode;
  /** IANA timezone, e.g. "Australia/Sydney". */
  timezone: string;
  /** Decimal degrees; null when the API has no coordinates for the airport. */
  location: { latitude: number; longitude: number } | null;
  /** Elevation in feet; null when unknown. */
  elevationFt: number | null;
  international: boolean;
  domestic: boolean;
  regional: boolean;
  online: boolean;
  eticketable: boolean;
}
