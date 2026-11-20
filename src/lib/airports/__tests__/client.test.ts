import { AIRPORTS_ENDPOINT, fetchAirports } from "../client";
import { airports } from "@/test/fixtures";

function respond(body: unknown, init?: ResponseInit) {
  global.fetch = jest.fn().mockResolvedValue({
    ok: (init?.status ?? 200) < 400,
    status: init?.status ?? 200,
    json: async () => body,
  });
}

describe("fetchAirports", () => {
  it("requests the app's API route and returns the airports", async () => {
    respond({ airports });
    await expect(fetchAirports()).resolves.toEqual(airports);
    expect(global.fetch).toHaveBeenCalledWith(AIRPORTS_ENDPOINT, expect.any(Object));
  });

  it("throws on a non-OK response", async () => {
    respond({ error: "boom" }, { status: 502 });
    await expect(fetchAirports()).rejects.toThrow();
  });

  it("throws on an unexpected payload", async () => {
    respond({ nope: true });
    await expect(fetchAirports()).rejects.toThrow(/unexpected response/i);
  });
});
