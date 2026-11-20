import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RouteError from "../error";

describe("RouteError boundary", () => {
  it("shows a recoverable message and retries", async () => {
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    const user = userEvent.setup();
    const retry = jest.fn();
    render(<RouteError error={new Error("render failed")} retry={retry} />);
    expect(screen.getByRole("alert")).toHaveTextContent(/something went wrong/i);
    await user.click(screen.getByRole("button", { name: /try again/i }));
    expect(retry).toHaveBeenCalled();
    jest.restoreAllMocks();
  });
});
