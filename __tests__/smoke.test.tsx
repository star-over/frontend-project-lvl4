import { renderToString } from "react-dom/server";
import type { Socket } from "socket.io-client";
import { expect, test, vi } from "vitest";

// Импорт по пути контракта, как это делает проверка Хекслета.
import init from "../src/init.jsx";

test("init принимает сокет, подписывается на события и возвращает разметку", async () => {
  const socket = { on: vi.fn<() => void>(), io: { on: vi.fn<() => void>() } };

  const markup = renderToString(await init(socket as unknown as Socket));

  expect(markup).toContain("Hexlet Chat");
  expect(socket.on).toHaveBeenCalledWith("newMessage", expect.any(Function));
});
