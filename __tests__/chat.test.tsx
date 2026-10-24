import { fireEvent, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

import { createServer, renderApp } from "./helpers.ts";

const openChat = () =>
  renderApp({
    user: "admin",
    fetch: createServer({
      messages: [
        { id: "1", body: "Привет!", channelId: "1", username: "admin" },
        { id: "2", body: "Как дела?", channelId: "1", username: "user" },
      ],
    }),
  });

test("чат загружает каналы и сообщения с токеном в Authorization", async () => {
  const { fetchMock } = await openChat();

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
  await openChat();

  fireEvent.click(await screen.findByRole("button", { name: "# random" }));

  expect(screen.getByRole("heading", { name: "# random" })).toBeTruthy();
  // Проверка Хекслета ищет текущий канал по тексту «# имя»: он должен быть один — в заголовке.
  expect(screen.getByText("# random").tagName).toBe("H5");
  expect(screen.getByText("0 сообщений")).toBeTruthy();
  expect(screen.queryByText(/Привет!/)).toBeNull();
});

test("ответ 401 разлогинивает и ведёт на /login", async () => {
  await renderApp({
    user: "admin",
    fetch: vi.fn<typeof fetch>(async () => new Response(null, { status: 401 })),
  });

  expect(await screen.findByRole("heading", { name: "Войти" })).toBeTruthy();
  expect(window.location.pathname).toBe("/login");
});

test("после переподключения сокета данные перечитываются с сервера", async () => {
  const { fetchMock, emit } = await openChat();
  await screen.findByRole("heading", { name: "# general" });
  expect(fetchMock).toHaveBeenCalledTimes(2);

  await emit("reconnect");

  await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(4));
});
