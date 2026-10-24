import { fireEvent, screen, waitFor } from "@testing-library/react";
import { expect, test } from "vitest";

import { useAuth } from "../src/stores/auth.ts";
import { renderApp } from "./helpers.ts";

const logInAs = async (username: string, password: string) => {
  const app = await renderApp({ path: "/login" });
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
});
