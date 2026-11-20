import { render, screen } from "@testing-library/react";
import { AppHeader } from "../AppHeader";

describe("AppHeader", () => {
  it("renders the app title as a link back to the list", () => {
    render(<AppHeader />);
    const link = screen.getByRole("link", { name: /airports viewer/i });
    expect(link).toHaveAttribute("href", "/");
  });
});
