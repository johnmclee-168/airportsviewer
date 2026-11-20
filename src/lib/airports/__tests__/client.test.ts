import { AIRPORTS_ENDPOINT, AirportsError, fetchAirports, toAirportsError } from "../client";
import { airports } from "@/test/fixtures";

function respond(body: unknown, init: { status?: number; statusText?: string } = {}) {
  const status = init.status ?? 200;
  global.fetch = jest.fn().mockResolvedValue({
    ok: status < 400,
    status,
    statusText: init.statusText ?? "",
    json: async () => body,
  });
}

function setOnline(online: boolean) {
  Object.defineProperty(window.navigator, "onLine", { configurable: true, get: () => online });
}

afterEach(() => setOnline(true));

describe("fetchAirports", () => {
  it("requests the app's API route and returns the airports", async () => {
    respond({ airports });
    await expect(fetchAirports()).resolves.toEqual(airports);
    expect(global.fetch).toHaveBeenCalledWith(AIRPORTS_ENDPOINT, expect.any(Object));
  });

  it("reports a server error with the API's message as detail", async () => {
    respond({ error: "Airports service responded with 503" }, { status: 502 });
    const error = await fetchAirports().catch((e: unknown) => e);
    expect(error).toBeInstanceOf(AirportsError);
    expect(error).toMatchObject({
      kind: "server",
      status: 502,
      detail: "Airports service responded with 503",
      title: "Airports are unavailable",
    });
  });

  it("falls back to the HTTP status when the error body is not JSON", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      json: async () => {
        throw new SyntaxError("Unexpected token");
      },
    });
    await expect(fetchAirports()).rejects.toMatchObject({
      kind: "server",
      detail: "HTTP 500 Internal Server Error",
    });
  });

  it("reports an invalid payload", async () => {
    respond({ nope: true });
    await expect(fetchAirports()).rejects.toMatchObject({ kind: "invalid" });
  });

  it("reports a network failure", async () => {
    global.fetch = jest.fn().mockRejectedValue(new TypeError("Failed to fetch"));
    await expect(fetchAirports()).rejects.toMatchObject({ kind: "network", detail: "Failed to fetch" });
  });

  it("reports offline without calling the network", async () => {
    setOnline(false);
    global.fetch = jest.fn();
    await expect(fetchAirports()).rejects.toMatchObject({ kind: "offline", title: "You're offline" });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("reports a timeout when the request takes too long", async () => {
    jest.spyOn(AbortSignal, "timeout").mockImplementation(() => AbortSignal.abort());
    global.fetch = jest.fn().mockRejectedValue(new DOMException("aborted", "AbortError"));
    await expect(fetchAirports()).rejects.toMatchObject({ kind: "timeout" });
    jest.restoreAllMocks();
  });

  it("rethrows caller aborts untouched", async () => {
    const controller = new AbortController();
    controller.abort();
    const abortError = new DOMException("aborted", "AbortError");
    global.fetch = jest.fn().mockRejectedValue(abortError);
    await expect(fetchAirports(controller.signal)).rejects.toBe(abortError);
  });
});

describe("toAirportsError", () => {
  it("passes AirportsErrors through", () => {
    const error = new AirportsError("offline");
    expect(toAirportsError(error)).toBe(error);
  });

  it("wraps anything else", () => {
    expect(toAirportsError("weird")).toMatchObject({ kind: "invalid", detail: "weird" });
  });
});
