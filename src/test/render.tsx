/**
 * Test helper: renders UI inside an AirportsProvider with an injectable loader.
 */
import { render, type RenderOptions } from "@testing-library/react";
import { AirportsProvider } from "@/context/AirportsProvider";
import { memoryStore, type AirportsStore } from "@/lib/airports/cache";
import type { Airport } from "@/lib/airports/types";
import { airports as defaultAirports } from "./fixtures";

export interface ProviderRenderOptions extends Omit<RenderOptions, "wrapper"> {
  loader?: (signal: AbortSignal) => Promise<Airport[]>;
  store?: AirportsStore;
}

export function renderWithAirports(
  ui: React.ReactElement,
  { loader = async () => defaultAirports, store = memoryStore(), ...options }: ProviderRenderOptions = {},
) {
  return render(ui, {
    wrapper: ({ children }) => (
      <AirportsProvider loader={loader} store={store}>
        {children}
      </AirportsProvider>
    ),
    ...options,
  });
}

/** A promise you can resolve/reject from the outside, for asserting loading states. */
export function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}
