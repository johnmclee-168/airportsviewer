import {
  formatElevation,
  formatLatitude,
  formatLongitude,
  getTimezoneInfo,
  googleMapsUrl,
  toDms,
} from "../format";

describe("coordinates", () => {
  it("formats decimal degrees as degrees/minutes/seconds", () => {
    expect(toDms(33.9306)).toBe("33°55′50″");
    expect(toDms(-0.4526)).toBe("0°27′09″");
  });

  it("rolls 60 seconds over into minutes and degrees", () => {
    expect(toDms(10.99999)).toBe("11°00′00″");
  });

  it("adds hemisphere letters from the sign", () => {
    expect(formatLatitude(-33.9306)).toBe("33°55′50″ S");
    expect(formatLatitude(51.47)).toBe("51°28′12″ N");
    expect(formatLongitude(151.1692)).toBe("151°10′09″ E");
    expect(formatLongitude(-0.4526)).toBe("0°27′09″ W");
  });

  it("builds a Google Maps search link", () => {
    expect(googleMapsUrl(-33.93, 151.17)).toBe(
      "https://www.google.com/maps/search/?api=1&query=-33.93,151.17",
    );
  });
});

describe("formatElevation", () => {
  it("shows feet and metres", () => {
    expect(formatElevation(21)).toBe("21 ft (6 m)");
    expect(formatElevation(5431)).toBe("5,431 ft (1,655 m)");
  });

  it("handles unknown elevation", () => {
    expect(formatElevation(null)).toBe("Unknown");
  });
});

describe("getTimezoneInfo", () => {
  const instant = new Date("2026-01-15T00:00:00Z");

  it("returns the UTC offset and local time", () => {
    const info = getTimezoneInfo("Australia/Sydney", instant);
    expect(info).toMatchObject({ id: "Australia/Sydney", offset: "GMT+11" });
    expect(info.localTime).toMatch(/15 Jan/);
    expect(info.localTime).toMatch(/11:00\s?am/i);
  });

  it("handles daylight-saving differences", () => {
    expect(getTimezoneInfo("Australia/Sydney", new Date("2026-07-15T00:00:00Z")).offset).toBe(
      "GMT+10",
    );
  });

  it("degrades gracefully for unknown zones", () => {
    expect(getTimezoneInfo("Mars/Olympus_Mons", instant)).toEqual({
      id: "Mars/Olympus_Mons",
      offset: null,
      localTime: null,
    });
  });
});
