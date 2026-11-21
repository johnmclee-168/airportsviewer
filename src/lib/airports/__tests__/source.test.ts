/**
 * @jest-environment node
 */
import {
  getAirports,
  QANTAS_AIRPORTS_URL,
  resetAirportsMemo,
  resolveSource,
  resolveUpstreamUrl,
  UpstreamError,
  type SourceEnv,
} from "../source";
import { rawAirports } from "@/test/fixtures";

const liveEnv: SourceEnv = { AIRPORTS_SOURCE: "live" };

function mockFetch(impl: () => Promise<Response>) {
  return jest.spyOn(global, "fetch").mockImplementation(impl);
}

afterEach(() => {
  jest.restoreAllMocks();
  resetAirportsMemo();
});

describe("resolveSource", () => {
  it("defaults to the live API", () => {
    expect(resolveSource({})).toBe("live");
  });

  it("uses the mock when AIRPORTS_SOURCE=mock", () => {
    expect(resolveSource({ AIRPORTS_SOURCE: "mock" })).toBe("mock");
  });
});

describe("resolveUpstreamUrl", () => {
  it("defaults to the Qantas API", () => {
    expect(resolveUpstreamUrl({})).toBe(QANTAS_AIRPORTS_URL);
    expect(resolveUpstreamUrl({ AIRPORTS_UPSTREAM_URL: "  " })).toBe(QANTAS_AIRPORTS_URL);
  });

  it("uses AIRPORTS_UPSTREAM_URL when set", () => {
    expect(resolveUpstreamUrl({ AIRPORTS_UPSTREAM_URL: "http://localhost:4000/x" })).toBe(
      "http://localhost:4000/x",
    );
  });
});

describe("getAirports (mock)", () => {
  it("reads and normalises the local snapshot", async () => {
    const fetchSpy = mockFetch(() => Promise.reject(new Error("should not be called")));
    const airports = await getAirports({ AIRPORTS_SOURCE: "mock" });
    expect(airports.length).toBeGreaterThan(1000);
    expect(airports.find((a) => a.code === "SYD")?.country.name).toBe("Australia");
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe("getAirports (live)", () => {
  it("fetches and normalises the upstream payload", async () => {
    const fetchSpy = mockFetch(async () => Response.json(rawAirports));
    const airports = await getAirports(liveEnv);
    expect(fetchSpy).toHaveBeenCalledWith(QANTAS_AIRPORTS_URL, expect.any(Object));
    expect(airports.map((a) => a.code)).toEqual(["AAB", "LHR", "SYD"]);
  });

  it("memoises the upstream response", async () => {
    const fetchSpy = mockFetch(async () => Response.json(rawAirports));
    await getAirports(liveEnv);
    await getAirports(liveEnv);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("fetches a custom upstream every time instead of memoising it", async () => {
    const url = "http://localhost:4000/flight/refData/airport";
    const fetchSpy = mockFetch(async () => Response.json(rawAirports));
    const env: SourceEnv = { ...liveEnv, AIRPORTS_UPSTREAM_URL: url };
    await getAirports(env);
    await getAirports(env);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(fetchSpy).toHaveBeenCalledWith(url, expect.any(Object));
  });

  it("throws an UpstreamError on a non-OK status", async () => {
    mockFetch(async () => new Response("nope", { status: 503 }));
    await expect(getAirports(liveEnv)).rejects.toMatchObject({
      name: "UpstreamError",
      status: 503,
    });
  });

  it("throws an UpstreamError when the network fails", async () => {
    mockFetch(() => Promise.reject(new TypeError("fetch failed")));
    await expect(getAirports(liveEnv)).rejects.toBeInstanceOf(UpstreamError);
  });

  it("can simulate a failure without calling the network", async () => {
    const fetchSpy = mockFetch(async () => Response.json(rawAirports));
    await expect(getAirports({ AIRPORTS_SIMULATE_FAILURE: "1" })).rejects.toMatchObject({
      name: "UpstreamError",
      status: 503,
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("throws an UpstreamError on an unexpected payload", async () => {
    mockFetch(async () => Response.json({ not: "an array" }));
    await expect(getAirports(liveEnv)).rejects.toThrow(/unexpected payload/);
  });
});
