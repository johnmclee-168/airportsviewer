import { filterAirports, foldText } from "../filter";
import { airports } from "@/test/fixtures";

const codes = (list: typeof airports) => list.map((a) => a.code);

describe("foldText", () => {
  it("lower-cases, trims and strips accents", () => {
    expect(foldText("  Zürich ")).toBe("zurich");
  });
});

describe("filterAirports", () => {
  it("returns everything for an empty query", () => {
    expect(filterAirports(airports, "   ")).toBe(airports);
  });

  it("matches on airport name", () => {
    expect(codes(filterAirports(airports, "kingsford"))).toEqual(["SYD"]);
  });

  it("matches on country, case-insensitively", () => {
    expect(codes(filterAirports(airports, "AUSTRALIA"))).toEqual(["AAB", "SYD"]);
  });

  it("matches on city and IATA code", () => {
    expect(codes(filterAirports(airports, "london"))).toEqual(["LHR"]);
    expect(codes(filterAirports(airports, "lhr"))).toEqual(["LHR"]);
  });

  it("returns an empty list when nothing matches", () => {
    expect(filterAirports(airports, "atlantis")).toEqual([]);
  });
});
