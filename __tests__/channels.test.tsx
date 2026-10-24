import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";

import { createServer, holdWrites, renderApp } from "./helpers.ts";

// Кроме двух каналов по умолчанию — созданный «custom» со своим сообщением.
const server = ({ offline = false } = {}) =>
  createServer({
    offline,
    channels: [
      { id: "1", name: "general", removable: false },
      { id: "2", name: "random", removable: false },
      { id: "3", name: "custom", removable: true },
    ],
    messages: [
      { id: "1", body: "В общем", channelId: "1", username: "admin" },
      { id: "2", body: "В своём", channelId: "3", username: "admin" },
    ],
  });

const openChat = async ({ offline = false, fetch = server({ offline }) } = {}) => {
  const app = await renderApp({ user: "admin", fetch });
  await screen.findByRole("heading", { name: "# general" });
  return app;
};

const dialog = () => screen.findByRole("dialog");

const openMenu = async (name: string, item: string) => {
  const row = screen.getByRole("button", { name: `# ${name}` }).parentElement!;
  fireEvent.click(within(row).getByRole("button", { name: "Управление каналом" }));
  fireEvent.click(await screen.findByRole("menuitem", { name: item }));
};

test("новый канал: поле в фокусе, Enter отправляет, создатель переходит в канал", async () => {
  const user = userEvent.setup();
  await openChat();

  await user.click(screen.getByRole("button", { name: "+" }));
  const input = within(await dialog()).getByLabelText("Имя канала");
  await waitFor(() => expect(document.activeElement).toBe(input));
  await user.keyboard("  new channel  {Enter}");

  expect(await screen.findByRole("heading", { name: "# new channel" })).toBeTruthy();
  expect(screen.getByRole("button", { name: "# new channel" })).toBeTruthy();
  expect(await screen.findByText("Канал создан")).toBeTruthy();
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
});

test("мат в имени нового канала фильтруется", async () => {
  await openChat();

  fireEvent.click(screen.getByRole("button", { name: "+" }));
  const input = within(await dialog()).getByLabelText("Имя канала");
  fireEvent.change(input, { target: { value: "boobs" } });
  fireEvent.submit(input.closest("form")!);

  expect(await screen.findByRole("heading", { name: "# *****" })).toBeTruthy();

  // Другое матерное слово той же длины после фильтра совпадает с «*****».
  fireEvent.click(screen.getByRole("button", { name: "+" }));
  const modal = await dialog();
  const again = within(modal).getByLabelText("Имя канала");
  fireEvent.change(again, { target: { value: "bitch" } });
  fireEvent.submit(again.closest("form")!);
  expect(await within(modal).findByText("Должно быть уникальным")).toBeTruthy();
});

test("имя канала проверяется: длина 3–20 и уникальность", async () => {
  const { fetchMock } = await openChat();

  fireEvent.click(screen.getByRole("button", { name: "+" }));
  const modal = await dialog();
  const input = within(modal).getByLabelText("Имя канала");
  const submit = within(modal).getByRole("button", { name: "Отправить" });

  fireEvent.change(input, { target: { value: "ab" } });
  fireEvent.click(submit);
  expect(await within(modal).findByText("От 3 до 20 символов")).toBeTruthy();

  fireEvent.change(input, { target: { value: "x".repeat(21) } });
  fireEvent.click(submit);
  expect(await within(modal).findByText("От 3 до 20 символов")).toBeTruthy();

  fireEvent.change(input, { target: { value: "random" } });
  fireEvent.click(submit);
  expect(await within(modal).findByText("Должно быть уникальным")).toBeTruthy();

  expect(fetchMock.mock.calls.some(([, o]) => o?.method === "POST")).toBe(false);
});

test("меню есть только у созданных каналов", async () => {
  await openChat();

  const menus = screen.getAllByRole("button", { name: "Управление каналом" });

  expect(menus).toHaveLength(1);
  expect(menus[0].parentElement!.textContent).toContain("# custom");
});

test("удаление с подтверждением уводит в канал по умолчанию и убирает сообщения", async () => {
  await openChat();
  fireEvent.click(screen.getByRole("button", { name: "# custom" }));
  expect(screen.getByText(/В своём/)).toBeTruthy();

  await openMenu("custom", "Удалить");
  const modal = await dialog();
  expect(within(modal).getByText("Уверены?")).toBeTruthy();
  fireEvent.click(within(modal).getByRole("button", { name: "Удалить" }));

  expect(await screen.findByRole("heading", { name: "# general" })).toBeTruthy();
  expect(screen.queryByRole("button", { name: "# custom" })).toBeNull();
  expect(screen.queryByText(/В своём/)).toBeNull();
  expect(await screen.findByText("Канал удалён")).toBeTruthy();
});

test("переименование: поле заполнено текущим именем, имя обновляется в списке", async () => {
  await openChat();

  await openMenu("custom", "Переименовать");
  const modal = await dialog();
  const input = within(modal).getByLabelText<HTMLInputElement>("Имя канала");
  expect(input.value).toBe("custom");
  fireEvent.focus(input);
  expect([input.selectionStart, input.selectionEnd]).toEqual([0, "custom".length]);
  fireEvent.change(input, { target: { value: "renamed" } });
  fireEvent.submit(input.closest("form")!);

  expect(await screen.findByRole("button", { name: "# renamed" })).toBeTruthy();
  expect(screen.queryByRole("button", { name: "# custom" })).toBeNull();
  expect(await screen.findByText("Канал переименован")).toBeTruthy();
});

test("без сети: создание канала — ошибка, модалка открыта, канала нет", async () => {
  await openChat({ offline: true });

  fireEvent.click(screen.getByRole("button", { name: "+" }));
  const input = within(await dialog()).getByLabelText("Имя канала");
  fireEvent.change(input, { target: { value: "new one" } });
  fireEvent.submit(input.closest("form")!);

  expect(await screen.findByText("Ошибка соединения")).toBeTruthy();
  expect(screen.getByRole("dialog")).toBeTruthy();
  expect(screen.queryByRole("button", { name: "# new one" })).toBeNull();
});

test("без сети: удаление канала — ошибка, модалка открыта, канал на месте", async () => {
  await openChat({ offline: true });

  await openMenu("custom", "Удалить");
  fireEvent.click(within(await dialog()).getByRole("button", { name: "Удалить" }));

  expect(await screen.findByText("Ошибка соединения")).toBeTruthy();
  expect(screen.getByRole("dialog")).toBeTruthy();
  expect(screen.getByRole("button", { name: "# custom" })).toBeTruthy();
});

test("события сокета: чужой канал появляется, удаление текущего уводит в general", async () => {
  const { emit } = await openChat();

  await emit("newChannel", { id: "50", name: "from bob", removable: true });
  fireEvent.click(screen.getByRole("button", { name: "# from bob" }));
  expect(screen.getByRole("heading", { name: "# from bob" })).toBeTruthy();

  await emit("renameChannel", { id: "50", name: "bob's", removable: true });
  expect(screen.getByRole("heading", { name: "# bob's" })).toBeTruthy();

  await emit("removeChannel", { id: "50" });
  expect(screen.getByRole("heading", { name: "# general" })).toBeTruthy();
});

test("«Отменить» и Escape закрывают модалку без запроса", async () => {
  const user = userEvent.setup();
  const { fetchMock } = await openChat();

  await user.click(screen.getByRole("button", { name: "+" }));
  await user.click(within(await dialog()).getByRole("button", { name: "Отменить" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());

  await user.click(screen.getByRole("button", { name: "+" }));
  await dialog();
  await user.keyboard("{Escape}");
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());

  expect(fetchMock.mock.calls.some(([, o]) => o?.method === "POST")).toBe(false);
});

test("пока запрос висит, кнопки модалок заблокированы", async () => {
  const { fetch, release } = holdWrites(server());
  await openChat({ fetch });

  fireEvent.click(screen.getByRole("button", { name: "+" }));
  const addModal = await dialog();
  fireEvent.change(within(addModal).getByLabelText("Имя канала"), { target: { value: "slow" } });
  fireEvent.click(within(addModal).getByRole("button", { name: "Отправить" }));
  await waitFor(() =>
    expect(
      within(addModal).getByRole<HTMLButtonElement>("button", { name: "Отправить" }).disabled,
    ).toBe(true),
  );
  await release();
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());

  await openMenu("custom", "Удалить");
  const removeModal = await dialog();
  fireEvent.click(within(removeModal).getByRole("button", { name: "Удалить" }));
  await waitFor(() =>
    expect(
      within(removeModal).getByRole<HTMLButtonElement>("button", { name: "Удалить" }).disabled,
    ).toBe(true),
  );
  await release();
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
});
