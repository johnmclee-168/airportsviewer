/**
 * @jest-environment node
 */
import { GET } from "../route";
import { getAirports, UpstreamError } from "@/lib/airports/source";
import { airports } from "@/test/fixtures";

jest.mock("next/server", () => ({ connection: jest.fn(async () => undefined) }));
jest.mock("@/lib/airports/source", () => {
  const actual = jest.requireActual("@/lib/airports/source");
  return { ...actual, getAirports: jest.fn() };
});

const mockedGetAirports = jest.mocked(getAirports);

describe("GET /api/airports", () => {
  beforeEach(() => jest.spyOn(console, "error").mockImplementation(() => undefined));
  afterEach(() => jest.restoreAllMocks());

  it("returns the airports as JSON", async () => {
    mockedGetAirports.mockResolvedValue(airports);
    const response = await GET();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ airports });
  });

  it("returns 502 with the upstream message when the API fails", async () => {
    mockedGetAirports.mockRejectedValue(new UpstreamError("Airports service responded with 503", 503));
    const response = await GET();
    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ error: "Airports service responded with 503" });
  });

  it("hides unexpected internal errors behind a generic message", async () => {
    mockedGetAirports.mockRejectedValue(new Error("boom"));
    const response = await GET();
    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ error: "Unexpected error loading airports" });
  });
});
