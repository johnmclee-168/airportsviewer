import { render } from "@testing-library/react";
import { ServiceWorkerRegistrar } from "../ServiceWorkerRegistrar";

const register = jest.fn().mockResolvedValue({});
const env = process.env as { NODE_ENV: string };
const originalEnv = env.NODE_ENV;

beforeAll(() => {
  Object.defineProperty(navigator, "serviceWorker", { configurable: true, value: { register } });
});

afterEach(() => {
  env.NODE_ENV = originalEnv;
  register.mockClear();
});

describe("ServiceWorkerRegistrar", () => {
  it("registers the service worker in production", () => {
    env.NODE_ENV = "production";
    const { container } = render(<ServiceWorkerRegistrar />);
    expect(register).toHaveBeenCalledWith("/sw.js", { scope: "/" });
    expect(container).toBeEmptyDOMElement();
  });

  it("does nothing outside production", () => {
    env.NODE_ENV = "development";
    render(<ServiceWorkerRegistrar />);
    expect(register).not.toHaveBeenCalled();
  });
});
