import { currencyCodeForCountry, getCurrencyInfo } from "../currency";
import { readFileSync } from "node:fs";
import path from "node:path";
import type { RawAirport } from "../types";

describe("currencyCodeForCountry", () => {
  it.each([
    ["AU", "AUD"],
    ["nz", "NZD"],
    ["GB", "GBP"],
    ["FR", "EUR"],
    ["BG", "EUR"],
    ["PF", "XPF"],
  ])("%s → %s", (country, currency) => {
    expect(currencyCodeForCountry(country)).toBe(currency);
  });

  it("returns null for places without a currency", () => {
    expect(currencyCodeForCountry("AQ")).toBeNull();
    expect(currencyCodeForCountry("XX")).toBeNull();
  });

  it("covers every inhabited country in the airport snapshot", () => {
    const snapshot = JSON.parse(
      readFileSync(path.join(process.cwd(), "mocks", "airports.json"), "utf8"),
    ) as RawAirport[];
    const missing = [...new Set(snapshot.map((a) => a.country.countryCode))].filter(
      (code) => code !== "AQ" && !currencyCodeForCountry(code),
    );
    expect(missing).toEqual([]);
  });
});

describe("getCurrencyInfo", () => {
  it("returns the code, name and symbol", () => {
    expect(getCurrencyInfo("AU")).toEqual({ code: "AUD", name: "Australian Dollar", symbol: "$" });
    expect(getCurrencyInfo("JP")).toMatchObject({ code: "JPY", symbol: "¥" });
  });

  it("returns null when the country has no currency", () => {
    expect(getCurrencyInfo("AQ")).toBeNull();
  });
});
