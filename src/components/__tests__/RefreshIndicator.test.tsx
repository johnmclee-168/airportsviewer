import { act, screen, waitFor } from "@testing-library/react";
import { RefreshIndicator } from "../RefreshIndicator";
import { memoryStore } from "@/lib/airports/cache";
import type { Airport } from "@/lib/airports/types";
import { airports } from "@/test/fixtures";
import { deferred, renderWithAirports } from "@/test/render";

describe("RefreshIndicator", () => {
  it("is hidden during the initial load (the loading screen covers it)", () => {
    const request = deferred<Airport[]>();
    renderWithAirports(<RefreshIndicator />, { loader: () => request.promise });
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });

  it("shows while cached airports are refreshed in the background", async () => {
    const store = memoryStore();
    await store.write(airports, 1000);
    const request = deferred<Airport[]>();
    renderWithAirports(<RefreshIndicator />, { store, loader: () => request.promise });

    expect(
      await screen.findByRole("progressbar", { name: /refreshing airports/i }),
    ).toBeInTheDocument();
    await act(async () => request.resolve(airports));
    await waitFor(() => expect(screen.queryByRole("progressbar")).not.toBeInTheDocument());
  });
});
