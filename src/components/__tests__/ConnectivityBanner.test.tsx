import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConnectivityBanner } from "../ConnectivityBanner";
import { memoryStore } from "@/lib/airports/cache";
import { AirportsError } from "@/lib/airports/client";
import type { Airport } from "@/lib/airports/types";
import { airports } from "@/test/fixtures";
import { renderWithAirports } from "@/test/render";

function setOnline(online: boolean) {
  Object.defineProperty(window.navigator, "onLine", { configurable: true, get: () => online });
}

async function seededStore(minutesAgo: number) {
  const store = memoryStore();
  await store.write(airports, Date.now() - minutesAgo * 60_000);
  return store;
}

afterEach(() => setOnline(true));

describe("ConnectivityBanner", () => {
  it("renders nothing when online with fresh data", async () => {
    const { container } = renderWithAirports(<ConnectivityBanner />);
    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });

  it("explains that cached data is shown when the refresh fails", async () => {
    const store = await seededStore(5);
    renderWithAirports(<ConnectivityBanner />, {
      store,
      loader: () => Promise.reject(new AirportsError("server")),
    });
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Couldn't refresh airports. Showing airports saved 5 minutes ago.",
    );
  });

  it("lets the user retry a failed refresh", async () => {
    const user = userEvent.setup();
    const store = await seededStore(5);
    const loader = jest
      .fn<Promise<Airport[]>, [AbortSignal]>()
      .mockRejectedValueOnce(new AirportsError("server"))
      .mockResolvedValueOnce(airports);
    renderWithAirports(<ConnectivityBanner />, { store, loader });

    await user.click(await screen.findByRole("button", { name: /retry/i }));
    await waitFor(() => expect(screen.queryByRole("status")).not.toBeInTheDocument());
    expect(loader).toHaveBeenCalledTimes(2);
  });

  it("shows an offline notice when the browser goes offline", async () => {
    renderWithAirports(<ConnectivityBanner />);
    act(() => {
      setOnline(false);
      window.dispatchEvent(new Event("offline"));
    });
    const banner = await screen.findByRole("status");
    expect(banner).toHaveTextContent(/you're offline/i);
    expect(banner).toHaveTextContent(/showing airports saved just now/i);
    expect(screen.queryByRole("button", { name: /retry/i })).not.toBeInTheDocument();
  });
});
