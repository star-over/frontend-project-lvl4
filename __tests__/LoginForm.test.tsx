import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expect, test, vi } from "vitest";

import { App } from "../src/components/App.tsx";
import { useAuth } from "../src/stores/auth.ts";

const logInAs = (username: string, password: string) => {
  window.history.pushState({}, "", "/login");
  render(<App />);
  fireEvent.change(screen.getByLabelText("Ваш ник"), { target: { value: username } });
  fireEvent.change(screen.getByLabelText("Пароль"), { target: { value: password } });
  fireEvent.click(screen.getByRole("button", { name: "Войти" }));
};

test("успешный вход сохраняет токен в localStorage и ведёт на главную", async () => {
  const fetchMock = vi.fn<typeof fetch>(async () =>
    Response.json({ token: "jwt", username: "admin" }),
  );
  vi.stubGlobal("fetch", fetchMock);

  logInAs("admin", "admin");

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
  vi.stubGlobal(
    "fetch",
    vi.fn<typeof fetch>(async () => new Response(null, { status: 401 })),
  );

  logInAs("admin", "wrong");

  expect(await screen.findByText("Неверные имя пользователя или пароль")).toBeTruthy();
  expect(window.location.pathname).toBe("/login");
  expect(useAuth.getState().user).toBeNull();
});
