import { cleanup, fireEvent, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import { renderApp, storedUser } from "./helpers.ts";

test("на /login показывается форма входа", async () => {
  await renderApp({ path: "/login" });

  expect(screen.getByRole("heading", { name: "Войти" })).toBeTruthy();
  expect(screen.getByLabelText("Ваш ник")).toBeTruthy();
  expect(screen.getByLabelText("Пароль")).toBeTruthy();
  expect(screen.getByRole("button", { name: "Войти" }).getAttribute("type")).toBe("submit");
  expect(screen.getByRole("link", { name: "Регистрация" }).getAttribute("href")).toBe("/signup");
});

test("без токена главная перенаправляет на /login", async () => {
  await renderApp({ path: "/" });

  expect(window.location.pathname).toBe("/login");
  expect(screen.getByRole("heading", { name: "Войти" })).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Выйти" })).toBeNull();
});

test("с токеном открывается главная, «Выйти» разлогинивает", async () => {
  await renderApp({ path: "/", user: "admin" });

  expect(window.location.pathname).toBe("/");
  screen.getByRole("button", { name: "Выйти" }).click();

  expect(storedUser()).toBeNull();
});

test("после выхода следующий вход начинается с чистого листа", async () => {
  const { fetchMock } = await renderApp({ path: "/", user: "admin" });
  fireEvent.click(await screen.findByRole("button", { name: "# random" }));
  expect(screen.getByRole("heading", { name: "# random" })).toBeTruthy();

  fireEvent.click(screen.getByRole("button", { name: "Выйти" }));
  fireEvent.change(await screen.findByLabelText("Ваш ник"), { target: { value: "admin" } });
  fireEvent.change(screen.getByLabelText("Пароль"), { target: { value: "admin" } });
  fireEvent.click(screen.getByRole("button", { name: "Войти" }));

  // Открыт канал по умолчанию, а не выбранный до выхода; каналы загружены заново.
  expect(await screen.findByRole("heading", { name: "# general" })).toBeTruthy();
  const channelLoads = fetchMock.mock.calls.filter(([url]) => String(url).endsWith("/channels"));
  expect(channelLoads).toHaveLength(2);
});

test("с токеном /login перенаправляет на главную", async () => {
  await renderApp({ path: "/login", user: "admin" });

  expect(window.location.pathname).toBe("/");
  expect(screen.queryByRole("heading", { name: "Войти" })).toBeNull();
});

test("неизвестный адрес показывает 404 со ссылкой на главную", async () => {
  await renderApp({ path: "/no-such-page" });

  expect(screen.getByText("Страница не найдена")).toBeTruthy();
  expect(screen.getByRole("link", { name: "на главную страницу" }).getAttribute("href")).toBe("/");
});

test("логотип в шапке ведёт на главную", async () => {
  await renderApp({ path: "/login" });

  expect(screen.getByRole("link", { name: "Hexlet Chat" }).getAttribute("href")).toBe("/");
});

// Проверка Хекслета зовёт init много раз на одной странице и между тестами чистит
// localStorage: прошлый запуск не должен донести вход, канал, модалку или уведомление.
test("новый запуск init не помнит состояние прошлого", async () => {
  const { emit } = await renderApp({ path: "/", user: "admin" });
  fireEvent.click(await screen.findByRole("button", { name: "# random" }));
  fireEvent.click(screen.getByRole("button", { name: "+" }));
  await screen.findByRole("dialog");
  await emit("disconnect", "transport close");
  expect(screen.getByText("Нет соединения с сервером")).toBeTruthy();

  cleanup();
  localStorage.clear();
  await renderApp({ path: "/" });
  expect(window.location.pathname).toBe("/login");

  cleanup();
  await renderApp({ path: "/", user: "admin" });
  expect(await screen.findByRole("heading", { name: "# general" })).toBeTruthy();
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(screen.queryByText("Нет соединения с сервером")).toBeNull();
});
