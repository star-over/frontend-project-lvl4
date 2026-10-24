import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";

import { createServer, holdWrites, renderApp } from "./helpers.ts";

const openChat = async ({ offline = false, fetch = createServer({ offline }) } = {}) => {
  const app = await renderApp({ user: "admin", fetch });
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

const input = () => screen.getByPlaceholderText<HTMLInputElement>("Введите сообщение...");
const sendButton = () => screen.getByRole<HTMLButtonElement>("button", { name: "Отправить" });

test("пока запрос висит, кнопка заблокирована; после отправки фокус снова в поле", async () => {
  const user = userEvent.setup();
  const { fetch, release } = holdWrites();
  const { fetchMock } = await openChat({ fetch });

  await user.type(input(), "  Привет  ");
  await user.click(sendButton());

  await waitFor(() => expect(sendButton().disabled).toBe(true));
  await release();
  expect(await screen.findByText(/Привет/)).toBeTruthy();
  expect(postedBody(fetchMock).body).toBe("Привет");
  expect(document.activeElement).toBe(input());
});

test("пустое сообщение и одни пробелы не отправляются", async () => {
  const user = userEvent.setup();
  await openChat();

  expect(sendButton().disabled).toBe(true);
  await user.type(input(), "   ");
  expect(sendButton().disabled).toBe(true);
});

test("смена канала возвращает фокус в поле ввода", async () => {
  const user = userEvent.setup();
  await openChat();

  await user.click(screen.getByRole("button", { name: "# random" }));

  expect(screen.getByRole("heading", { name: "# random" })).toBeTruthy();
  expect(document.activeElement).toBe(input());
});

test("новое сообщение прокручивает ленту вниз", async () => {
  const { emit } = await openChat();
  const scrollTo = vi.spyOn(Element.prototype, "scrollTo");

  await emit("newMessage", { id: "11", body: "Новое", channelId: "1", username: "user" });

  expect(scrollTo).toHaveBeenCalledWith({ top: expect.any(Number) });
});

test("Enter отправляет сообщение", async () => {
  const user = userEvent.setup();
  await openChat();

  await user.type(input(), "По Enter{Enter}");

  expect(await screen.findByText(/По Enter/)).toBeTruthy();
});
