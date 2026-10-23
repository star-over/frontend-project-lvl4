import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

import { useAuth } from "../src/stores/auth.ts";

// jsdom не реализует matchMedia, а Mantine читает через него цветовую схему.
window.matchMedia = (query) =>
  ({
    matches: false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }) as unknown as MediaQueryList;

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  useAuth.setState({ user: null });
  localStorage.clear();
  window.history.pushState({}, "", "/");
});
