import { fc } from "@fast-check/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

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

// Seed property-тестов можно зафиксировать (так делает make mutation), иначе он случайный.
if (process.env.FC_SEED) fc.configureGlobal({ seed: Number(process.env.FC_SEED) });

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  localStorage.clear();
  window.history.pushState({}, "", "/");
});
