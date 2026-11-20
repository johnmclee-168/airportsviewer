import { normalizeAirport, normalizeAirports } from "../normalize";
import { rawAirports, rawArrabury, rawLondon, rawSydney, rawUnknownLocation } from "@/test/fixtures";

describe("normalizeAirport", () => {
  it("maps the core identity fields", () => {
    const airport = normalizeAirport(rawSydney);
    expect(airport).toMatchObject({
      code: "SYD",
      name: "Sydney (Kingsford Smith)",
      city: { code: "SYD", name: "Sydney" },
      country: { code: "AU", name: "Australia" },
      region: { code: "AU", name: "Australia" },
      timezone: "Australia/Sydney",
      state: null,
      international: true,
      domestic: true,
      regional: false,
    });
  });

  it("derives signed decimal degrees from the radian fields", () => {
    expect(normalizeAirport(rawSydney).location).toEqual({ latitude: -33.9306, longitude: 151.1692 });
    // Western hemisphere: longitude must be negative.
    expect(normalizeAirport(rawLondon).location?.longitude).toBeLessThan(0);
    expect(normalizeAirport(rawLondon).location?.latitude).toBeGreaterThan(0);
  });

  it("returns a null location when the API has no coordinates", () => {
    expect(normalizeAirport(rawUnknownLocation).location).toBeNull();
  });

  it("treats the -99999 elevation sentinel as unknown", () => {
    expect(normalizeAirport(rawSydney).elevationFt).toBe(21);
    expect(normalizeAirport(rawArrabury).elevationFt).toBeNull();
  });

  it("keeps the state when present", () => {
    expect(normalizeAirport(rawArrabury).state).toEqual({ code: "QLD", name: "Queensland" });
  });

  it("falls back to the airport name when the city name is missing", () => {
    expect(normalizeAirport(rawUnknownLocation).city.name).toBe("Mystery Field");
  });
});

describe("normalizeAirports", () => {
  it("sorts airports by name", () => {
    expect(normalizeAirports(rawAirports).map((a) => a.code)).toEqual(["AAB", "LHR", "SYD"]);
  });

  it("drops malformed records", () => {
    const withJunk = [rawSydney, null, { foo: 1 }] as unknown as typeof rawAirports;
    expect(normalizeAirports(withJunk).map((a) => a.code)).toEqual(["SYD"]);
  });
});
