import { act, renderHook, waitFor } from "@testing-library/react";
import { AirportsProvider, useAirports } from "../AirportsProvider";
import { memoryStore, type AirportsStore } from "@/lib/airports/cache";
import { AirportsError } from "@/lib/airports/client";
import type { Airport } from "@/lib/airports/types";
import { airports, sydney } from "@/test/fixtures";
import { deferred } from "@/test/render";

function setup(loader: (signal: AbortSignal) => Promise<Airport[]>, store: AirportsStore) {
  return renderHook(() => useAirports(), {
    wrapper: ({ children }) => (
      <AirportsProvider loader={loader} store={store}>
        {children}
      </AirportsProvider>
    ),
  });
}

async function seededStore(data: Airport[], savedAt: number) {
  const store = memoryStore();
  await store.write(data, savedAt);
  return store;
}

describe("AirportsProvider caching", () => {
  it("saves fresh airports to the cache", async () => {
    const store = memoryStore();
    const { result } = setup(async () => airports, store);
    await waitFor(() => expect(result.current.dataSource).toBe("network"));
    expect(result.current.savedAt).toEqual(expect.any(Number));
    await waitFor(async () => expect((await store.read())?.airports).toEqual(airports));
  });

  it("shows cached airports immediately, then replaces them with fresh data", async () => {
    const store = await seededStore([sydney], 1000);
    const request = deferred<Airport[]>();
    const { result } = setup(() => request.promise, store);

    await waitFor(() => expect(result.current.dataSource).toBe("cache"));
    expect(result.current.status).toBe("success");
    expect(result.current.airports).toEqual([sydney]);
    expect(result.current.savedAt).toBe(1000);
    expect(result.current.isFetching).toBe(true);

    await act(async () => request.resolve(airports));
    expect(result.current.dataSource).toBe("network");
    expect(result.current.airports).toEqual(airports);
    expect(result.current.isFetching).toBe(false);
  });

  it("falls back to cached airports when the network fails", async () => {
    const store = await seededStore(airports, 1000);
    const { result } = setup(() => Promise.reject(new AirportsError("offline")), store);

    await waitFor(() => expect(result.current.refreshError).not.toBeNull());
    expect(result.current.status).toBe("success");
    expect(result.current.error).toBeNull();
    expect(result.current.dataSource).toBe("cache");
    expect(result.current.airports).toEqual(airports);
    expect(result.current.refreshError?.kind).toBe("offline");
  });

  it("enters the error state when there is no cache to fall back to", async () => {
    const { result } = setup(() => Promise.reject(new AirportsError("server")), memoryStore());
    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.error?.kind).toBe("server");
    expect(result.current.refreshError).toBeNull();
  });

  it("keeps showing data while a manual refresh runs and clears the stale flag on success", async () => {
    const store = await seededStore(airports, 1000);
    const loader = jest
      .fn<Promise<Airport[]>, [AbortSignal]>()
      .mockRejectedValueOnce(new AirportsError("network"))
      .mockResolvedValueOnce(airports);
    const { result } = setup(loader, store);
    await waitFor(() => expect(result.current.refreshError).not.toBeNull());

    act(() => result.current.reload());
    expect(result.current.status).toBe("success");
    expect(result.current.isFetching).toBe(true);

    await waitFor(() => expect(result.current.dataSource).toBe("network"));
    expect(result.current.refreshError).toBeNull();
  });

  it("refreshes stale data automatically when the browser comes back online", async () => {
    const store = await seededStore(airports, 1000);
    const loader = jest
      .fn<Promise<Airport[]>, [AbortSignal]>()
      .mockRejectedValueOnce(new AirportsError("offline"))
      .mockResolvedValueOnce(airports);
    const { result } = setup(loader, store);
    await waitFor(() => expect(result.current.refreshError).not.toBeNull());

    act(() => {
      window.dispatchEvent(new Event("online"));
    });
    await waitFor(() => expect(result.current.dataSource).toBe("network"));
    expect(loader).toHaveBeenCalledTimes(2);
  });
});
