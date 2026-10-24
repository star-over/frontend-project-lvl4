import { screen, waitFor } from "@testing-library/react";
import { expect, test, vi } from "vitest";

import { renderApp } from "./helpers.ts";

test("ошибка загрузки данных показывает уведомление", async () => {
  await renderApp({
    user: "admin",
    fetch: vi.fn<typeof fetch>(async () => new Response(null, { status: 500 })),
  });

  // Текст дважды: плашка на странице и всплывающее уведомление.
  await waitFor(() => expect(screen.getAllByText("Ошибка загрузки данных")).toHaveLength(2), {
    timeout: 3000,
  });
});

test("обрыв сокета показывает уведомление, переподключение его убирает", async () => {
  const { emit } = await renderApp({ user: "admin" });
  await screen.findByRole("heading", { name: "# general" });

  await emit("disconnect", "transport close");
  expect(screen.getByText("Нет соединения с сервером")).toBeTruthy();

  await emit("connect");
  await waitFor(() => expect(screen.queryByText("Нет соединения с сервером")).toBeNull());
});

test("закрытие сокета самим клиентом — не обрыв сети", async () => {
  const { emit } = await renderApp({ user: "admin" });

  await emit("disconnect", "io client disconnect");

  expect(screen.queryByText("Нет соединения с сервером")).toBeNull();
});
