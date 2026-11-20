import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AirportList, PAGE_SIZE } from "../AirportList";
import { airports } from "@/test/fixtures";
import { deferred, renderWithAirports } from "@/test/render";
import { AirportsError } from "@/lib/airports/client";
import type { Airport } from "@/lib/airports/types";

jest.mock("next/link", () => jest.requireActual("@/test/mockNextLink"));

function manyAirports(count: number): Airport[] {
  return Array.from({ length: count }, (_, i) => ({
    ...airports[0],
    code: `A${String(i).padStart(3, "0")}`,
    name: `Airport ${String(i).padStart(3, "0")}`,
  }));
}

describe("AirportList", () => {
  it("shows a loading state while airports are fetched", () => {
    const request = deferred<Airport[]>();
    renderWithAirports(<AirportList />, { loader: () => request.promise });
    expect(screen.getByRole("status")).toHaveTextContent(/loading airports/i);
  });

  it("lists every airport with its name and country", async () => {
    renderWithAirports(<AirportList />);
    const list = await screen.findByRole("list", { name: "Airports" });
    const rows = within(list).getAllByRole("link");
    expect(rows).toHaveLength(3);
    expect(rows[2]).toHaveTextContent("Sydney (Kingsford Smith)");
    expect(rows[2]).toHaveTextContent("Australia");
    expect(screen.getByText("3 airports")).toBeInTheDocument();
  });

  it("links each airport to its detail page", async () => {
    renderWithAirports(<AirportList />);
    expect(await screen.findByRole("link", { name: /sydney/i })).toHaveAttribute("href", "/airports/SYD");
  });

  it("highlights the airport that was tapped", async () => {
    const user = userEvent.setup();
    renderWithAirports(<AirportList />);

    const sydney = await screen.findByRole("link", { name: /sydney/i });
    expect(sydney).not.toHaveAttribute("aria-current");
    await user.click(sydney);

    expect(sydney).toHaveAttribute("aria-current", "true");

    await user.click(screen.getByRole("link", { name: /london/i }));
    expect(sydney).not.toHaveAttribute("aria-current");
    expect(screen.getByRole("link", { name: /london/i })).toHaveAttribute("aria-current", "true");
  });

  it("filters the list as the user types and can clear the search", async () => {
    const user = userEvent.setup();
    renderWithAirports(<AirportList />);
    await user.type(await screen.findByRole("searchbox"), "heathrow");

    await waitFor(() =>
      expect(within(screen.getByRole("list", { name: "Airports" })).getAllByRole("link")).toHaveLength(1),
    );
    expect(screen.getByText("1 of 3")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /clear search/i }));
    await waitFor(() =>
      expect(within(screen.getByRole("list", { name: "Airports" })).getAllByRole("link")).toHaveLength(3),
    );
  });

  it("shows an empty state when nothing matches", async () => {
    const user = userEvent.setup();
    renderWithAirports(<AirportList />);
    await user.type(await screen.findByRole("searchbox"), "atlantis");
    expect(await screen.findByText(/no airports match/i)).toBeInTheDocument();
  });

  it("renders long lists in pages", async () => {
    const user = userEvent.setup();
    const many = manyAirports(PAGE_SIZE * 2 + 5);
    renderWithAirports(<AirportList />, { loader: async () => many });

    const list = await screen.findByRole("list", { name: "Airports" });
    expect(within(list).getAllByRole("link")).toHaveLength(PAGE_SIZE);

    await user.click(screen.getByRole("button", { name: /show more/i }));
    expect(within(list).getAllByRole("link")).toHaveLength(PAGE_SIZE * 2);

    await user.click(screen.getByRole("button", { name: /show more/i }));
    expect(within(list).getAllByRole("link")).toHaveLength(many.length);
    expect(screen.queryByRole("button", { name: /show more/i })).not.toBeInTheDocument();
  });

  it("shows the error and lets the user retry", async () => {
    const user = userEvent.setup();
    const loader = jest
      .fn<Promise<Airport[]>, [AbortSignal]>()
      .mockRejectedValueOnce(new AirportsError("server", "HTTP 503", 503))
      .mockResolvedValueOnce(airports);
    renderWithAirports(<AirportList />, { loader });

    expect(await screen.findByRole("alert")).toHaveTextContent(/airports are unavailable/i);
    await user.click(screen.getByRole("button", { name: /try again/i }));
    expect(await screen.findByRole("list", { name: "Airports" })).toBeInTheDocument();
  });
});
