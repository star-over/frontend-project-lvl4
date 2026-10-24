import { screen, waitFor } from "@testing-library/react";
import { expect, test, vi } from "vitest";

import { renderApp } from "./helpers.ts";

test("ошибка загрузки данных показывает одно уведомление на оба запроса", async () => {
  const { fetchMock } = await renderApp({
    user: "admin",
    fetch: vi.fn<typeof fetch>(async () => new Response(null, { status: 500 })),
  });

  // Каналы и сообщения: по попытке и повтору — и только потом считать уведомления.
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(4), { timeout: 3000 });
  // Текст дважды: плашка на странице и одно всплывающее уведомление.
  await waitFor(() => expect(screen.getAllByText("Ошибка загрузки данных")).toHaveLength(2));
  await new Promise((resolve) => setTimeout(resolve, 50));
  expect(screen.getAllByText("Ошибка загрузки данных")).toHaveLength(2);
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
