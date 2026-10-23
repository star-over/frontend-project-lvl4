import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import { App } from "../src/components/App.tsx";
import { useAuth } from "../src/stores/auth.ts";

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

test("без токена главная перенаправляет на /login", () => {
  renderAt("/");

  expect(window.location.pathname).toBe("/login");
  expect(screen.getByRole("heading", { name: "Войти" })).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Выйти" })).toBeNull();
});

test("с токеном открывается главная, «Выйти» разлогинивает", () => {
  useAuth.setState({ user: { token: "t", username: "admin" } });
  renderAt("/");

  expect(window.location.pathname).toBe("/");
  screen.getByRole("button", { name: "Выйти" }).click();

  expect(useAuth.getState().user).toBeNull();
});

test("с токеном /login перенаправляет на главную", () => {
  useAuth.setState({ user: { token: "t", username: "admin" } });
  renderAt("/login");

  expect(window.location.pathname).toBe("/");
  expect(screen.queryByRole("heading", { name: "Войти" })).toBeNull();
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
