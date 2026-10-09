import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import { App } from "../src/components/App.tsx";

const renderAt = (path: string) => {
  window.history.pushState({}, "", path);
  render(<App />);
};

test("на /login показывается форма входа", () => {
  renderAt("/login");

  expect(screen.getByRole("heading", { name: "Войти" })).toBeTruthy();
  expect(screen.getByLabelText("Ваш ник")).toBeTruthy();
  expect(screen.getByLabelText("Пароль")).toBeTruthy();
  expect(screen.getByRole("button", { name: "Войти" }).getAttribute("type")).toBe("submit");
  expect(screen.getByRole("link", { name: "Регистрация" }).getAttribute("href")).toBe("/signup");
});

test("неизвестный адрес показывает 404 со ссылкой на главную", () => {
  renderAt("/no-such-page");

  expect(screen.getByText("Страница не найдена")).toBeTruthy();
  expect(screen.getByRole("link", { name: "на главную страницу" }).getAttribute("href")).toBe("/");
});

test("логотип в шапке ведёт на главную", () => {
  renderAt("/login");

  expect(screen.getByRole("link", { name: "Hexlet Chat" }).getAttribute("href")).toBe("/");
});
