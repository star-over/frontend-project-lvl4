import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import { App } from "../src/components/App.tsx";

const renderAt = (path: string) => {
  window.history.pushState({}, "", path);
  render(<App />);
};

test("на /login показывается форма входа", () => {
  renderAt("/login");

  expect(screen.getByRole("heading", { name: "Login" })).toBeTruthy();
  expect(screen.getByRole("link", { name: "Регистрация" }).getAttribute("href")).toBe("/signup");
});

test("неизвестный адрес показывает 404", () => {
  renderAt("/no-such-page");

  expect(screen.getByText("404 - Not found page")).toBeTruthy();
});

test("логотип в шапке ведёт на главную", () => {
  renderAt("/login");

  expect(screen.getByRole("link", { name: "Hexlet Chat" }).getAttribute("href")).toBe("/");
});
