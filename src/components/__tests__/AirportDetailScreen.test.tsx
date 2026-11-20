import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useParams, useRouter } from "next/navigation";
import { AirportDetailScreen } from "../AirportDetailScreen";
import { useAirports } from "@/context/AirportsProvider";
import { airports } from "@/test/fixtures";
import { deferred, renderWithAirports } from "@/test/render";
import { AirportsError } from "@/lib/airports/client";
import type { Airport } from "@/lib/airports/types";

jest.mock("next/navigation", () => ({ useParams: jest.fn(), useRouter: jest.fn() }));

const router = { back: jest.fn(), push: jest.fn() };

function visit(code: string) {
  jest.mocked(useParams).mockReturnValue({ code });
  jest.mocked(useRouter).mockReturnValue(router as unknown as ReturnType<typeof useRouter>);
}

/** Pre-selects an airport, as the list does when a row is tapped. */
function SelectThenShow({ code }: { code: string }) {
  const { selectedCode, selectAirport } = useAirports();
  if (selectedCode !== code) {
    selectAirport(code);
    return null;
  }
  return <AirportDetailScreen />;
}

describe("AirportDetailScreen", () => {
  beforeEach(() => jest.clearAllMocks());

  it("shows a loading state until airports arrive", async () => {
    visit("SYD");
    const request = deferred<Airport[]>();
    renderWithAirports(<AirportDetailScreen />, { loader: () => request.promise });
    expect(screen.getByRole("status")).toHaveTextContent(/loading airport/i);
    await act(async () => request.resolve(airports));
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Sydney (Kingsford Smith)");
  });

  it("resolves the airport from a lower-case URL code", async () => {
    visit("lhr");
    renderWithAirports(<AirportDetailScreen />);
    expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent("London (Heathrow)");
  });

  it("shows a not-found state for unknown codes", async () => {
    const user = userEvent.setup();
    visit("XYZ");
    renderWithAirports(<AirportDetailScreen />);
    expect(await screen.findByRole("heading", { name: /airport not found/i })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /back to airports/i }));
    expect(router.push).toHaveBeenCalledWith("/");
  });

  it("goes back in history when the user came from the list", async () => {
    const user = userEvent.setup();
    visit("SYD");
    renderWithAirports(<SelectThenShow code="SYD" />);
    await user.click(await screen.findByRole("button", { name: /back to airports/i }));
    expect(router.back).toHaveBeenCalled();
    expect(router.push).not.toHaveBeenCalled();
  });

  it("navigates to the list when opened from a deep link", async () => {
    const user = userEvent.setup();
    visit("SYD");
    renderWithAirports(<AirportDetailScreen />);
    await user.click(await screen.findByRole("button", { name: /back to airports/i }));
    expect(router.push).toHaveBeenCalledWith("/");
    expect(router.back).not.toHaveBeenCalled();
  });

  it("shows the error with retry and a way back to the list", async () => {
    const user = userEvent.setup();
    visit("SYD");
    renderWithAirports(<AirportDetailScreen />, {
      loader: () => Promise.reject(new AirportsError("timeout")),
    });
    expect(await screen.findByRole("alert")).toHaveTextContent(/taking too long/i);
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /all airports/i }));
    expect(router.push).toHaveBeenCalledWith("/");
  });
});
