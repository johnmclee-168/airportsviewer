import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ErrorState } from "../ErrorState";
import { AirportsError } from "@/lib/airports/client";

describe("ErrorState", () => {
  it("shows a friendly title and message for the error kind", () => {
    render(<ErrorState error={new AirportsError("offline")} onRetry={jest.fn()} />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "You're offline" })).toBeInTheDocument();
    expect(screen.getByText(/check your internet connection/i)).toBeInTheDocument();
    expect(screen.queryByText(/technical details/i)).not.toBeInTheDocument();
  });

  it("offers technical details when available", () => {
    render(<ErrorState error={new AirportsError("server", "upstream 503", 502)} onRetry={jest.fn()} />);
    expect(screen.getByText(/technical details/i)).toBeInTheDocument();
    expect(screen.getByText("502: upstream 503")).toBeInTheDocument();
  });

  it("calls onRetry and renders extra actions", async () => {
    const user = userEvent.setup();
    const onRetry = jest.fn();
    render(
      <ErrorState error={new AirportsError("timeout")} onRetry={onRetry}>
        <button type="button">Extra</button>
      </ErrorState>,
    );
    await user.click(screen.getByRole("button", { name: /try again/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Extra" })).toBeInTheDocument();
  });
});
