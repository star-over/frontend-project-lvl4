import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

import { useAuth } from "../src/stores/auth.ts";
import { useUi } from "../src/stores/ui.ts";

// jsdom не реализует matchMedia, а Mantine читает через него цветовую схему.
window.matchMedia = (query) =>
  ({
    matches: false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }) as unknown as MediaQueryList;

// ScrollArea из Mantine следит за размерами через ResizeObserver, которого в jsdom нет.
window.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Лента прокручивается к последнему сообщению, а jsdom не умеет scrollTo у элементов.
Element.prototype.scrollTo = () => {};

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  useAuth.setState(useAuth.getInitialState());
  useUi.setState(useUi.getInitialState());
  localStorage.clear();
  window.history.pushState({}, "", "/");
});
