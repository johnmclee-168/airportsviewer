"use client";
/**
 * AirportsProvider
 * Client-side store for the airport list, mounted once in the root layout so the
 * data survives navigation between the list and detail pages.
 *
 * Loading strategy (stale-while-revalidate with offline fallback):
 * 1. On start-up, airports saved in the persistent cache are shown immediately.
 * 2. /api/airports is always requested; fresh data replaces the cached copy and
 *    is saved for next time.
 * 3. If the request fails but cached data exists, the cached data stays on
 *    screen and `refreshError` explains why it may be out of date. Only when
 *    there is nothing cached does the app enter the full "error" state.
 * 4. A failed load or refresh is retried automatically when the browser comes
 *    back online.
 *
 * It also remembers the selected airport (highlighted in the list) and the
 * current search text.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { createDefaultStore, type AirportsStore } from "@/lib/airports/cache";
import { AirportsError, fetchAirports, toAirportsError } from "@/lib/airports/client";
import type { Airport } from "@/lib/airports/types";

export type AirportsStatus = "loading" | "success" | "error";
export type AirportsDataSource = "network" | "cache";

export interface AirportsContextValue {
  status: AirportsStatus;
  airports: Airport[];
  /** Set when there is no data to show at all. */
  error: AirportsError | null;
  /** Where the airports on screen came from. */
  dataSource: AirportsDataSource | null;
  /** When the airports on screen were fetched from the network (epoch ms). */
  savedAt: number | null;
  /** Set when a refresh failed and cached airports are shown instead. */
  refreshError: AirportsError | null;
  /** True while a network request is in flight. */
  isFetching: boolean;
  reload: () => void;
  selectedCode: string | null;
  selectAirport: (code: string | null) => void;
  /** Search text, kept here so it survives a round trip to the detail page. */
  query: string;
  setQuery: (query: string) => void;
}

const AirportsContext = createContext<AirportsContextValue | null>(null);

export interface AirportsProviderProps {
  children: React.ReactNode;
  /** Injectable for tests. */
  loader?: (signal: AbortSignal) => Promise<Airport[]>;
  /** Persistent cache; defaults to Cache Storage in the browser. */
  store?: AirportsStore;
}

interface DataState {
  airports: Airport[];
  dataSource: AirportsDataSource | null;
  savedAt: number | null;
  error: AirportsError | null;
  refreshError: AirportsError | null;
  isFetching: boolean;
}

const initialData: DataState = {
  airports: [],
  dataSource: null,
  savedAt: null,
  error: null,
  refreshError: null,
  isFetching: true,
};

export function AirportsProvider({ children, loader = fetchAirports, store }: AirportsProviderProps) {
  const [data, setData] = useState<DataState>(initialData);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [attempt, setAttempt] = useState(0);
  const loaderRef = useRef(loader);
  const [cacheStore] = useState<AirportsStore>(() => store ?? createDefaultStore());

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    // Show cached airports straight away if nothing is on screen yet.
    const cached = cacheStore.read().then((entry) => {
      if (!entry || signal.aborted) return;
      setData((current) =>
        current.dataSource === null
          ? { ...current, airports: entry.airports, dataSource: "cache", savedAt: entry.savedAt }
          : current,
      );
    });

    loaderRef
      .current(signal)
      .then((airports) => {
        const savedAt = Date.now();
        setData({
          airports,
          dataSource: "network",
          savedAt,
          error: null,
          refreshError: null,
          isFetching: false,
        });
        void cacheStore.write(airports, savedAt);
      })
      .catch(async (err: unknown) => {
        if (signal.aborted) return;
        const error = toAirportsError(err);
        await cached; // Make sure a cache hit has been applied before deciding.
        if (signal.aborted) return;
        setData((current) =>
          current.airports.length > 0
            ? { ...current, error: null, refreshError: error, isFetching: false }
            : { ...current, error, refreshError: null, isFetching: false },
        );
      });

    return () => controller.abort();
  }, [attempt, cacheStore]);

  const reload = useCallback(() => {
    setData((current) => ({ ...current, error: null, isFetching: true }));
    setAttempt((n) => n + 1);
  }, []);

  const hasFailure = Boolean(data.error || data.refreshError);

  // Recover automatically when connectivity returns after a failed load or refresh.
  useEffect(() => {
    if (!hasFailure) return;
    window.addEventListener("online", reload);
    return () => window.removeEventListener("online", reload);
  }, [hasFailure, reload]);

  const status: AirportsStatus =
    data.airports.length > 0 || data.dataSource ? "success" : data.error ? "error" : "loading";

  const value = useMemo<AirportsContextValue>(
    () => ({
      status,
      ...data,
      reload,
      selectedCode,
      selectAirport: setSelectedCode,
      query,
      setQuery,
    }),
    [status, data, reload, selectedCode, query],
  );

  return <AirportsContext.Provider value={value}>{children}</AirportsContext.Provider>;
}

export function useAirports(): AirportsContextValue {
  const context = useContext(AirportsContext);
  if (!context) throw new Error("useAirports must be used within an AirportsProvider");
  return context;
}
