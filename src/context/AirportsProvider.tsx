"use client";
/**
 * AirportsProvider
 * Client-side store for the airport list, mounted once in the root layout so the
 * data survives navigation between the list and detail pages. It fetches
 * /api/airports on mount, exposes the load status, a typed error, a `reload`
 * action (also triggered automatically when the browser comes back online), the
 * code of the most recently selected airport (used to highlight it in the list)
 * and the current search text.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AirportsError, fetchAirports, toAirportsError } from "@/lib/airports/client";
import type { Airport } from "@/lib/airports/types";

export type AirportsStatus = "loading" | "success" | "error";

export interface AirportsContextValue {
  status: AirportsStatus;
  airports: Airport[];
  error: AirportsError | null;
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
}

export function AirportsProvider({ children, loader = fetchAirports }: AirportsProviderProps) {
  const [status, setStatus] = useState<AirportsStatus>("loading");
  const [airports, setAirports] = useState<Airport[]>([]);
  const [error, setError] = useState<AirportsError | null>(null);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [attempt, setAttempt] = useState(0);
  const loaderRef = useRef(loader);

  useEffect(() => {
    const controller = new AbortController();
    loaderRef
      .current(controller.signal)
      .then((data) => {
        setAirports(data);
        setError(null);
        setStatus("success");
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(toAirportsError(err));
        setStatus("error");
      });
    return () => controller.abort();
  }, [attempt]);

  const reload = useCallback(() => {
    setStatus("loading");
    setError(null);
    setAttempt((n) => n + 1);
  }, []);

  // Recover automatically when connectivity returns after a failed load.
  useEffect(() => {
    if (status !== "error") return;
    window.addEventListener("online", reload);
    return () => window.removeEventListener("online", reload);
  }, [status, reload]);

  const value = useMemo<AirportsContextValue>(
    () => ({
      status,
      airports,
      error,
      reload,
      selectedCode,
      selectAirport: setSelectedCode,
      query,
      setQuery,
    }),
    [status, airports, error, reload, selectedCode, query],
  );

  return <AirportsContext.Provider value={value}>{children}</AirportsContext.Provider>;
}

export function useAirports(): AirportsContextValue {
  const context = useContext(AirportsContext);
  if (!context) throw new Error("useAirports must be used within an AirportsProvider");
  return context;
}
