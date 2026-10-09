import { renderToString } from "react-dom/server";
import type { Socket } from "socket.io-client";
import { expect, test } from "vitest";

// Импорт по пути контракта, как это делает проверка Хекслета.
import init from "../src/init.jsx";

test("init принимает сокет и возвращает разметку", async () => {
  const markup = renderToString(await init({} as Socket));

  expect(markup).toContain("Hexlet Chat");
});
