import { fireEvent, screen, waitFor } from "@testing-library/react";
import { expect, test } from "vitest";

import { useAuth } from "../src/stores/auth.ts";
import { createServer, holdWrites, renderApp } from "./helpers.ts";

const logInAs = async (username: string, password: string, { offline = false } = {}) => {
  const app = await renderApp({ path: "/login", fetch: createServer({ offline }) });
  fireEvent.change(screen.getByLabelText("Ваш ник"), { target: { value: username } });
  fireEvent.change(screen.getByLabelText("Пароль"), { target: { value: password } });
  fireEvent.click(screen.getByRole("button", { name: "Войти" }));
  return app;
};

test("успешный вход сохраняет токен в localStorage и ведёт на главную", async () => {
  const { fetchMock } = await logInAs("admin", "admin");

  await waitFor(() => expect(window.location.pathname).toBe("/"));
  expect(fetchMock).toHaveBeenCalledWith(
    "/api/v1/login",
    expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ username: "admin", password: "admin" }),
    }),
  );
  expect(useAuth.getState().user).toEqual({ token: "jwt", username: "admin" });
  expect(localStorage.getItem("auth")).toContain("jwt");
});

test("неверный пароль показывает ошибку в форме", async () => {
  await logInAs("admin", "wrong");

  expect(await screen.findByText("Неверные имя пользователя или пароль")).toBeTruthy();
  expect(window.location.pathname).toBe("/login");
  expect(useAuth.getState().user).toBeNull();
  // Ожидаемый отказ разбирает форма — общего уведомления об ошибке нет.
  expect(screen.queryByText("Ошибка соединения")).toBeNull();
});

test("без сети вход показывает «Ошибка соединения» и остаётся на /login", async () => {
  await logInAs("admin", "admin", { offline: true });

  expect(await screen.findByText("Ошибка соединения")).toBeTruthy();
  expect(window.location.pathname).toBe("/login");
  expect(screen.queryByText("Неверные имя пользователя или пароль")).toBeNull();
});

test("пока вход выполняется, кнопка «Войти» заблокирована", async () => {
  const { fetch, release } = holdWrites();
  await renderApp({ path: "/login", fetch });
  fireEvent.change(screen.getByLabelText("Ваш ник"), { target: { value: "admin" } });
  fireEvent.change(screen.getByLabelText("Пароль"), { target: { value: "admin" } });
  fireEvent.click(screen.getByRole("button", { name: "Войти" }));

  await waitFor(() =>
    expect(screen.getByRole<HTMLButtonElement>("button", { name: "Войти" }).disabled).toBe(true),
  );
  await release();
  await waitFor(() => expect(window.location.pathname).toBe("/"));
});
