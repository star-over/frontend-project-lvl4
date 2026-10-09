import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

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
  window.history.pushState({}, "", "/");
});
