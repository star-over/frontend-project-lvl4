import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { Socket } from "socket.io-client";
import { expect, test, vi } from "vitest";

import init from "../src/init.tsx";
import { useAuth } from "../src/stores/auth.ts";

const channels = [{ id: "1", name: "general", removable: false }];
const sent = { id: "10", body: "Привет всем", channelId: "1", username: "admin" };

// Заглушка сокета: запоминает обработчики, emit вызывает их, как это сделал бы сервер.
const fakeSocket = () => {
  const handlers: Record<string, (payload: unknown) => void> = {};
  return {
    on: (event: string, handler: (payload: unknown) => void) => {
      handlers[event] = handler;
    },
    io: { on: () => {} },
    // TanStack Query уведомляет подписчиков на следующем тике — ждём его внутри act.
    emit: (event: string, payload: unknown) =>
      act(async () => {
        handlers[event]?.(payload);
        await new Promise((resolve) => setTimeout(resolve, 0));
      }),
  };
};

const openChat = async (postMessage: () => Promise<Response>) => {
  const fetchMock = vi.fn<typeof fetch>(async (url, options) => {
    if (options?.method === "POST") return postMessage();
    return Response.json(String(url).endsWith("/channels") ? channels : []);
  });
  vi.stubGlobal("fetch", fetchMock);
  useAuth.setState({ user: { token: "jwt", username: "admin" } });
  window.history.pushState({}, "", "/");
  const socket = fakeSocket();
  render(await init(socket as unknown as Socket));
  await screen.findByText("0 сообщений");
  return { fetchMock, socket };
};

const send = (text: string) => {
  fireEvent.change(screen.getByPlaceholderText("Введите сообщение..."), {
    target: { value: text },
  });
  fireEvent.click(screen.getByRole("button", { name: "Отправить" }));
};

test("сообщение уходит POST-запросом, появляется в ленте, поле очищается", async () => {
  const { fetchMock } = await openChat(async () => Response.json(sent));

  send("Привет всем");

  expect(await screen.findByText(/Привет всем/)).toBeTruthy();
  expect(screen.getByText("1 сообщение")).toBeTruthy();
  expect(screen.getByPlaceholderText<HTMLInputElement>("Введите сообщение...").value).toBe("");
  const [, options] = fetchMock.mock.calls.find(([, o]) => o?.method === "POST")!;
  expect(JSON.parse(String(options?.body))).toEqual({
    body: "Привет всем",
    channelId: "1",
    username: "admin",
  });
});

test("сообщение из сокета появляется в ленте, дубль после POST не задваивается", async () => {
  const { socket } = await openChat(async () => Response.json(sent));

  await socket.emit("newMessage", {
    id: "11",
    body: "От другого",
    channelId: "1",
    username: "user",
  });
  expect(screen.getByText(/От другого/)).toBeTruthy();

  send("Привет всем");
  await screen.findByText(/Привет всем/);
  await socket.emit("newMessage", sent);

  expect(screen.getAllByText(/Привет всем/)).toHaveLength(1);
  expect(screen.getByText("2 сообщения")).toBeTruthy();
});

test("при обрыве сети текст остаётся в поле и показывается ошибка", async () => {
  await openChat(async () => {
    throw new TypeError("Failed to fetch");
  });

  send("Не дойдёт");

  expect(await screen.findByText("Ошибка соединения")).toBeTruthy();
  await waitFor(() =>
    expect(screen.getByPlaceholderText<HTMLInputElement>("Введите сообщение...").value).toBe(
      "Не дойдёт",
    ),
  );
  expect(screen.getByText("0 сообщений")).toBeTruthy();
});
