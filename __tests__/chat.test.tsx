import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

import { App } from "../src/components/App.tsx";
import { useAuth } from "../src/stores/auth.ts";

const data: Record<string, unknown> = {
  "/api/v1/channels": [
    { id: "1", name: "general", removable: false },
    { id: "2", name: "random", removable: false },
  ],
  "/api/v1/messages": [
    { id: "1", body: "Привет!", channelId: "1", username: "admin" },
    { id: "2", body: "Как дела?", channelId: "1", username: "user" },
  ],
};

const openChat = () => {
  const fetchMock = vi.fn<typeof fetch>(async (url) => Response.json(data[String(url)]));
  vi.stubGlobal("fetch", fetchMock);
  useAuth.setState({ user: { token: "jwt", username: "admin" } });
  window.history.pushState({}, "", "/");
  render(<App />);
  return fetchMock;
};

test("чат загружает каналы и сообщения с токеном в Authorization", async () => {
  const fetchMock = openChat();

  expect(await screen.findByRole("button", { name: "# random" })).toBeTruthy();
  expect(screen.getByRole("heading", { name: "# general" })).toBeTruthy();
  expect(screen.getByText("2 сообщения")).toBeTruthy();
  expect(screen.getByText(/Привет!/)).toBeTruthy();
  expect(screen.getByPlaceholderText("Введите сообщение...")).toBeTruthy();
  expect(fetchMock).toHaveBeenCalledTimes(2);
  for (const [, init] of fetchMock.mock.calls) {
    expect(init?.headers).toEqual({ Authorization: "Bearer jwt" });
  }
});

test("выбор канала показывает его сообщения", async () => {
  openChat();

  fireEvent.click(await screen.findByRole("button", { name: "# random" }));

  expect(screen.getByRole("heading", { name: "# random" })).toBeTruthy();
  expect(screen.getByText("0 сообщений")).toBeTruthy();
  expect(screen.queryByText(/Привет!/)).toBeNull();
});

test("ответ 401 разлогинивает и ведёт на /login", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn<typeof fetch>(async () => new Response(null, { status: 401 })),
  );
  useAuth.setState({ user: { token: "expired", username: "admin" } });
  window.history.pushState({}, "", "/");
  render(<App />);

  expect(await screen.findByRole("heading", { name: "Войти" })).toBeTruthy();
  expect(window.location.pathname).toBe("/login");
});
