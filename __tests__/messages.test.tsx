import { fireEvent, screen, waitFor } from "@testing-library/react";
import { expect, test } from "vitest";

import { createServer, renderApp } from "./helpers.ts";

const openChat = async ({ offline = false } = {}) => {
  const app = await renderApp({ user: "admin", fetch: createServer({ offline }) });
  await screen.findByText("0 сообщений");
  return app;
};

const send = (text: string) => {
  fireEvent.change(screen.getByPlaceholderText("Введите сообщение..."), {
    target: { value: text },
  });
  fireEvent.click(screen.getByRole("button", { name: "Отправить" }));
};

const postedBody = (fetchMock: Awaited<ReturnType<typeof openChat>>["fetchMock"]) => {
  const [, options] = fetchMock.mock.calls.find(([, o]) => o?.method === "POST")!;
  return JSON.parse(String(options?.body));
};

test("сообщение уходит POST-запросом, появляется в ленте, поле очищается", async () => {
  const { fetchMock } = await openChat();

  send("Привет всем");

  expect(await screen.findByText(/Привет всем/)).toBeTruthy();
  expect(screen.getByText("1 сообщение")).toBeTruthy();
  expect(screen.getByPlaceholderText<HTMLInputElement>("Введите сообщение...").value).toBe("");
  expect(postedBody(fetchMock)).toEqual({ body: "Привет всем", channelId: "1", username: "admin" });
});

test("сообщение из сокета появляется в ленте, дубль после POST не задваивается", async () => {
  const { emit } = await openChat();

  await emit("newMessage", { id: "11", body: "От другого", channelId: "1", username: "user" });
  expect(screen.getByText(/От другого/)).toBeTruthy();

  send("Привет всем");
  await screen.findByText(/Привет всем/);
  // Сервер выдал отправленному сообщению id "100" и разослал его всем, включая автора.
  await emit("newMessage", { id: "100", body: "Привет всем", channelId: "1", username: "admin" });

  expect(screen.getAllByText(/Привет всем/)).toHaveLength(1);
  expect(screen.getByText("2 сообщения")).toBeTruthy();
});

test("при обрыве сети текст остаётся в поле и показывается ошибка", async () => {
  await openChat({ offline: true });

  send("Не дойдёт");

  expect(await screen.findByText("Ошибка соединения")).toBeTruthy();
  await waitFor(() =>
    expect(screen.getByPlaceholderText<HTMLInputElement>("Введите сообщение...").value).toBe(
      "Не дойдёт",
    ),
  );
  expect(screen.getByText("0 сообщений")).toBeTruthy();
});

test("мат в сообщении фильтруется до отправки", async () => {
  const { fetchMock } = await openChat();

  send("you boobs");

  await waitFor(() => expect(postedBody(fetchMock).body).toBe("you *****"));
});
