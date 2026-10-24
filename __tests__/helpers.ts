import { act, render } from "@testing-library/react";
import type { Socket } from "socket.io-client";
import { type Mock, vi } from "vitest";

import type { Channel, Message } from "../src/api.ts";
import init from "../src/init.tsx";
import { useAuth } from "../src/stores/auth.ts";

type Handler = (payload?: unknown) => void;

// Заглушка сокета: запоминает обработчики (и socket.on, и socket.io.on), emit вызывает их,
// как это сделал бы сервер или менеджер переподключений.
export const fakeSocket = () => {
  const handlers: Record<string, Handler> = {};
  const on = (event: string, handler: Handler) => {
    handlers[event] = handler;
  };
  const socket = { on, io: { on } } as unknown as Socket;
  // TanStack Query уведомляет подписчиков на следующем тике — ждём его внутри act.
  const emit = (event: string, payload?: unknown) =>
    act(async () => {
      handlers[event]?.(payload);
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  return { socket, emit };
};

type ServerOptions = { channels?: Channel[]; messages?: Message[]; offline?: boolean };

// Сервер в памяти: отвечает так же, как @hexlet/chat-server.
// Изменения сохраняются: после reconnect перечитывание видит то же, что вернул сервер.
// Созданные каналы и сообщения получают id по порядку: "100", "101", …
// Вход — admin/admin (иначе 401); регистрация admin — 409.
// offline: изменяющие запросы падают, как при пропавшей сети.
export const createServer = ({
  channels = [
    { id: "1", name: "general", removable: false },
    { id: "2", name: "random", removable: false },
  ],
  messages = [],
  offline = false,
}: ServerOptions = {}) => {
  let nextId = 100;
  return vi.fn<typeof fetch>(async (url, options) => {
    const method = options?.method ?? "GET";
    const path = String(url).replace("/api/v1", "");
    const body = options?.body ? JSON.parse(String(options.body)) : {};
    const id = path.split("/")[2];
    if (offline && method !== "GET") throw new TypeError("Failed to fetch");
    // Настоящий сервер без этого заголовка тело не разбирает.
    if (options?.body && new Headers(options.headers).get("Content-Type") !== "application/json") {
      return new Response(null, { status: 415 });
    }
    switch (`${method} ${path.replace(/\/\d+$/, "/:id")}`) {
      case "POST /login":
        return body.username === "admin" && body.password === "admin"
          ? Response.json({ token: "jwt", username: "admin" })
          : new Response(null, { status: 401 });
      case "POST /signup":
        return body.username === "admin"
          ? new Response(null, { status: 409 })
          : Response.json({ token: "jwt", username: body.username }, { status: 201 });
      case "GET /channels":
        return Response.json(channels);
      case "GET /messages":
        return Response.json(messages);
      case "POST /channels": {
        const channel = { id: String(nextId++), name: body.name, removable: true };
        channels = [...channels, channel];
        return Response.json(channel);
      }
      case "PATCH /channels/:id": {
        channels = channels.map((c) => (c.id === id ? { ...c, name: body.name } : c));
        return Response.json(channels.find((c) => c.id === id));
      }
      case "DELETE /channels/:id":
        channels = channels.filter((c) => c.id !== id);
        messages = messages.filter((m) => m.channelId !== id);
        return Response.json({ id });
      case "POST /messages": {
        const message = { ...body, id: String(nextId++) };
        messages = [...messages, message];
        return Response.json(message);
      }
      default:
        return new Response(null, { status: 404 });
    }
  });
};

type RenderOptions = { path?: string; user?: string; fetch?: Mock<typeof fetch> };

// Единственный способ поднять приложение в тестах — тот же, что в продакшене: init(socket).
// user — имя вошедшего пользователя (токен "jwt"); fetch — по умолчанию сервер в памяти.
export const renderApp = async ({
  path = "/",
  user,
  fetch = createServer(),
}: RenderOptions = {}) => {
  vi.stubGlobal("fetch", fetch);
  if (user) useAuth.setState({ user: { token: "jwt", username: user } });
  window.history.pushState({}, "", path);
  const { socket, emit } = fakeSocket();
  render(await init(socket));
  return { fetchMock: fetch, emit };
};
