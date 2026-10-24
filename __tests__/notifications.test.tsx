import { render, screen, waitFor } from "@testing-library/react";
import type { Socket } from "socket.io-client";
import { expect, test, vi } from "vitest";

import init from "../src/init.tsx";
import { useAuth } from "../src/stores/auth.ts";
import { fakeSocket } from "./helpers.ts";

const openChat = async (fetchMock: typeof fetch) => {
  vi.stubGlobal("fetch", fetchMock);
  useAuth.setState({ user: { token: "jwt", username: "admin" } });
  window.history.pushState({}, "", "/");
  const socket = fakeSocket();
  render(await init(socket as unknown as Socket));
  return socket;
};

test("ошибка загрузки данных показывает уведомление", async () => {
  await openChat(async () => new Response(null, { status: 500 }));

  // Текст дважды: плашка на странице и всплывающее уведомление.
  await waitFor(() => expect(screen.getAllByText("Ошибка загрузки данных")).toHaveLength(2), {
    timeout: 3000,
  });
});

test("обрыв сокета показывает уведомление, переподключение его убирает", async () => {
  const socket = await openChat(async (url) =>
    Response.json(String(url).endsWith("/channels") ? [{ id: "1", name: "general" }] : []),
  );
  await screen.findByRole("heading", { name: "# general" });

  await socket.emit("disconnect", "transport close");
  expect(screen.getByText("Нет соединения с сервером")).toBeTruthy();

  await socket.emit("connect", undefined);
  await waitFor(() => expect(screen.queryByText("Нет соединения с сервером")).toBeNull());
});

test("закрытие сокета самим клиентом — не обрыв сети", async () => {
  const socket = await openChat(async () => Response.json([]));

  await socket.emit("disconnect", "io client disconnect");

  expect(screen.queryByText("Нет соединения с сервером")).toBeNull();
});
