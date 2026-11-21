import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AirportDetail } from "../AirportDetail";
import { normalizeAirport } from "@/lib/airports/normalize";
import { arrabury, rawUnknownLocation, sydney } from "@/test/fixtures";

describe("AirportDetail", () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: new Date("2026-01-15T00:00:00Z") });
  });
  afterEach(() => jest.useRealTimers());

  it("shows the airport identity and type badges", () => {
    render(<AirportDetail airport={sydney} onBack={jest.fn()} />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Sydney (Kingsford Smith)" }),
    ).toBeInTheDocument();
    expect(screen.getByText("SYD")).toBeInTheDocument();
    expect(screen.getByText("Sydney, Australia")).toBeInTheDocument();
    const badges = within(screen.getByRole("list", { name: "Airport type" }));
    expect(badges.getByText("International")).toBeInTheDocument();
    expect(badges.getByText("Domestic")).toBeInTheDocument();
    expect(badges.queryByText("Regional")).not.toBeInTheDocument();
  });

  it("includes the state when the airport has one", () => {
    render(<AirportDetail airport={arrabury} onBack={jest.fn()} />);
    expect(screen.getByText("Queensland, Australia")).toBeInTheDocument();
  });

  it("shows the currency", () => {
    render(<AirportDetail airport={sydney} onBack={jest.fn()} />);
    const currency = within(screen.getByRole("region", { name: "Currency" }));
    expect(currency.getByText("AUD")).toBeInTheDocument();
    expect(currency.getByText("Australian Dollar")).toBeInTheDocument();
  });

  it("shows the timezone with the local time and UTC offset", () => {
    render(<AirportDetail airport={sydney} onBack={jest.fn()} />);
    const timezone = within(screen.getByRole("region", { name: "Timezone" }));
    expect(timezone.getByText("Australia/Sydney")).toBeInTheDocument();
    expect(timezone.getByLabelText("Local time")).toHaveTextContent(/11:00\s?am/i);
    expect(timezone.getByText(/GMT\+11/)).toBeInTheDocument();
  });

  it("shows the location with a map link", () => {
    render(<AirportDetail airport={sydney} onBack={jest.fn()} />);
    const location = within(screen.getByRole("region", { name: "Location" }));
    expect(location.getByText("33°55′50″ S")).toBeInTheDocument();
    expect(location.getByText("151°10′09″ E")).toBeInTheDocument();
    expect(location.getByText("21 ft (6 m)")).toBeInTheDocument();
    expect(location.getByRole("link", { name: /google maps/i })).toHaveAttribute(
      "href",
      expect.stringContaining("query=-33.9306,151.1692"),
    );
  });

  it("explains when coordinates are not available", () => {
    render(<AirportDetail airport={normalizeAirport(rawUnknownLocation)} onBack={jest.fn()} />);
    const location = within(screen.getByRole("region", { name: "Location" }));
    expect(location.getByText("Not available")).toBeInTheDocument();
    expect(location.queryByRole("link")).not.toBeInTheDocument();
    expect(
      within(screen.getByRole("region", { name: "Currency" })).getByText(/no official currency/i),
    ).toBeInTheDocument();
  });

  it("calls onBack from both back controls", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const onBack = jest.fn();
    render(<AirportDetail airport={sydney} onBack={onBack} />);
    await user.click(screen.getByRole("button", { name: /all airports/i }));
    await user.click(screen.getByRole("button", { name: /back to airports/i }));
    expect(onBack).toHaveBeenCalledTimes(2);
  });
});
