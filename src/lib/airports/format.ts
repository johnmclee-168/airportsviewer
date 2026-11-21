/**
 * Display helpers for the airport detail page: coordinates, elevation,
 * timezone offsets/local time and map links.
 */

/** 33.9306 → 33°55′50″ (always positive; pair with a hemisphere letter). */
export function toDms(decimal: number): string {
  const abs = Math.abs(decimal);
  let degrees = Math.floor(abs);
  let minutes = Math.floor((abs - degrees) * 60);
  let seconds = Math.round(((abs - degrees) * 60 - minutes) * 60);
  if (seconds === 60) {
    seconds = 0;
    minutes += 1;
  }
  if (minutes === 60) {
    minutes = 0;
    degrees += 1;
  }
  return `${degrees}°${String(minutes).padStart(2, "0")}′${String(seconds).padStart(2, "0")}″`;
}

export function formatLatitude(latitude: number): string {
  return `${toDms(latitude)} ${latitude < 0 ? "S" : "N"}`;
}

export function formatLongitude(longitude: number): string {
  return `${toDms(longitude)} ${longitude < 0 ? "W" : "E"}`;
}

export function formatElevation(feet: number | null): string {
  if (feet === null) return "Unknown";
  const metres = Math.round(feet * 0.3048);
  return `${feet.toLocaleString("en-AU")} ft (${metres.toLocaleString("en-AU")} m)`;
}

export function googleMapsUrl(latitude: number, longitude: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
}

export interface TimezoneInfo {
  /** IANA identifier, e.g. "Australia/Sydney". */
  id: string;
  /** e.g. "GMT+11". Null when the runtime does not know the zone. */
  offset: string | null;
  /** Local time at the airport, e.g. "Thu 20 Nov, 7:05 pm". */
  localTime: string | null;
}

export function getTimezoneInfo(
  timeZone: string,
  now: Date = new Date(),
  locale = "en-AU",
): TimezoneInfo {
  try {
    const offset =
      new Intl.DateTimeFormat(locale, { timeZone, timeZoneName: "shortOffset" })
        .formatToParts(now)
        .find((part) => part.type === "timeZoneName")?.value ?? null;
    const localTime = new Intl.DateTimeFormat(locale, {
      timeZone,
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
    }).format(now);
    return { id: timeZone, offset, localTime };
  } catch {
    return { id: timeZone, offset: null, localTime: null };
  }
}
