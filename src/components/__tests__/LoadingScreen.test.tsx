import { act, render, screen } from "@testing-library/react";
import { LoadingScreen, SLOW_AFTER_MS, VERY_SLOW_AFTER_MS } from "../LoadingScreen";

describe("LoadingScreen", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("announces the loading label", () => {
    render(<LoadingScreen />);
    expect(screen.getByRole("status")).toHaveTextContent("Loading airports…");
  });

  it("shows skeleton rows hinting at the list", () => {
    render(<LoadingScreen skeletonRows={4} />);
    expect(screen.getByTestId("skeleton-list").children).toHaveLength(4);
  });

  it("can omit the skeleton", () => {
    render(<LoadingScreen label="Loading airport…" skeletonRows={0} />);
    expect(screen.getByRole("status")).toHaveTextContent("Loading airport…");
    expect(screen.queryByTestId("skeleton-list")).not.toBeInTheDocument();
  });

  it("reassures the user when loading takes a while", () => {
    render(<LoadingScreen />);
    expect(screen.queryByText(/still working/i)).not.toBeInTheDocument();

    act(() => jest.advanceTimersByTime(SLOW_AFTER_MS));
    expect(screen.getByRole("status")).toHaveTextContent(/still working/i);

    act(() => jest.advanceTimersByTime(VERY_SLOW_AFTER_MS - SLOW_AFTER_MS));
    expect(screen.getByRole("status")).toHaveTextContent(/taking longer than usual/i);
  });

  it("stops its timers when unmounted", () => {
    const { unmount } = render(<LoadingScreen />);
    unmount();
    expect(jest.getTimerCount()).toBe(0);
  });
});
