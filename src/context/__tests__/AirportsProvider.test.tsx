import { act, renderHook, waitFor } from "@testing-library/react";
import { AirportsProvider, useAirports } from "../AirportsProvider";
import { airports } from "@/test/fixtures";
import { deferred } from "@/test/render";
import type { Airport } from "@/lib/airports/types";

function setup(loader: (signal: AbortSignal) => Promise<Airport[]>) {
  return renderHook(() => useAirports(), {
    wrapper: ({ children }) => <AirportsProvider loader={loader}>{children}</AirportsProvider>,
  });
}

describe("AirportsProvider", () => {
  it("starts loading and then exposes the airports", async () => {
    const request = deferred<Airport[]>();
    const { result } = setup(() => request.promise);
    expect(result.current.status).toBe("loading");

    await act(async () => request.resolve(airports));
    expect(result.current.status).toBe("success");
    expect(result.current.airports).toEqual(airports);
  });

  it("exposes the error message when loading fails", async () => {
    const { result } = setup(() => Promise.reject(new Error("Service unavailable")));
    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.error).toBe("Service unavailable");
  });

  it("reload() retries the request", async () => {
    const loader = jest
      .fn<Promise<Airport[]>, [AbortSignal]>()
      .mockRejectedValueOnce(new Error("fail"))
      .mockResolvedValueOnce(airports);
    const { result } = setup(loader);
    await waitFor(() => expect(result.current.status).toBe("error"));

    act(() => result.current.reload());
    expect(result.current.status).toBe("loading");
    await waitFor(() => expect(result.current.status).toBe("success"));
    expect(loader).toHaveBeenCalledTimes(2);
  });

  it("remembers the selected airport and search query", async () => {
    const { result } = setup(async () => airports);
    act(() => {
      result.current.selectAirport("SYD");
      result.current.setQuery("syd");
    });
    expect(result.current.selectedCode).toBe("SYD");
    expect(result.current.query).toBe("syd");
  });

  it("throws a helpful error when used outside the provider", () => {
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    expect(() => renderHook(() => useAirports())).toThrow(/within an AirportsProvider/);
    jest.restoreAllMocks();
  });
});
