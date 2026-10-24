import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expect, test, vi } from "vitest";

import { App } from "../src/components/App.tsx";
import { useAuth } from "../src/stores/auth.ts";

const openSignup = (signup: () => Promise<Response>) => {
  const fetchMock = vi.fn<typeof fetch>(async (url) =>
    String(url).endsWith("/signup") ? signup() : Response.json([]),
  );
  vi.stubGlobal("fetch", fetchMock);
  window.history.pushState({}, "", "/signup");
  render(<App />);
  return fetchMock;
};

const fill = (username: string, password: string, confirmPassword: string) => {
  fireEvent.change(screen.getByLabelText("Имя пользователя"), { target: { value: username } });
  fireEvent.change(screen.getByLabelText("Пароль"), { target: { value: password } });
  fireEvent.change(screen.getByLabelText("Подтвердите пароль"), {
    target: { value: confirmPassword },
  });
  fireEvent.click(screen.getByRole("button", { name: "Зарегистрироваться" }));
};

test("со страницы входа есть ссылка на регистрацию", () => {
  window.history.pushState({}, "", "/login");
  render(<App />);

  fireEvent.click(screen.getByRole("link", { name: "Регистрация" }));

  expect(window.location.pathname).toBe("/signup");
  expect(screen.getByRole("heading", { name: "Регистрация" })).toBeTruthy();
});

test("пустая форма: все поля обязательны, запроса нет", async () => {
  const fetchMock = openSignup(async () => Response.json({}));

  fill("", "", "");

  expect(await screen.findAllByText("Обязательное поле")).toHaveLength(3);
  expect(fetchMock).not.toHaveBeenCalled();
});

test("имя 3–20 символов, пароль от 6, подтверждение совпадает", async () => {
  const fetchMock = openSignup(async () => Response.json({}));

  fill("ab", "12345", "54321");

  expect(await screen.findByText("От 3 до 20 символов")).toBeTruthy();
  expect(screen.getByText("Не менее 6 символов")).toBeTruthy();
  expect(screen.getByText("Пароли должны совпадать")).toBeTruthy();

  fill("x".repeat(21), "123456", "123456");
  expect(await screen.findByText("От 3 до 20 символов")).toBeTruthy();
  expect(fetchMock).not.toHaveBeenCalled();
});

test("успешная регистрация логинит и ведёт в чат", async () => {
  const fetchMock = openSignup(async () =>
    Response.json({ token: "jwt", username: "newuser" }, { status: 201 }),
  );

  fill("newuser", "123456", "123456");

  await waitFor(() => expect(window.location.pathname).toBe("/"));
  expect(useAuth.getState().user).toEqual({ token: "jwt", username: "newuser" });
  const [, options] = fetchMock.mock.calls.find(([url]) => String(url).endsWith("/signup"))!;
  expect(JSON.parse(String(options?.body))).toEqual({ username: "newuser", password: "123456" });
});

test("ответ 409 показывает, что пользователь уже существует", async () => {
  openSignup(async () => new Response(null, { status: 409 }));

  fill("admin", "123456", "123456");

  expect(await screen.findByText("Такой пользователь уже существует")).toBeTruthy();
  expect(window.location.pathname).toBe("/signup");
  expect(useAuth.getState().user).toBeNull();
});

test("вошедшего пользователя /signup отправляет в чат", () => {
  vi.stubGlobal(
    "fetch",
    vi.fn<typeof fetch>(async () => Response.json([])),
  );
  useAuth.setState({ user: { token: "jwt", username: "admin" } });
  window.history.pushState({}, "", "/signup");
  render(<App />);

  expect(window.location.pathname).toBe("/");
});
