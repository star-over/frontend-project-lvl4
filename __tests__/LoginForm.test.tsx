import { MantineProvider } from "@mantine/core";
import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

import { LoginForm } from "../src/components/LoginForm.tsx";

const setup = () => {
  render(
    <MantineProvider>
      <LoginForm />
    </MantineProvider>,
  );

  return {
    username: screen.getByLabelText(/User Name/),
    password: screen.getByLabelText(/Password/),
    submit: () => fireEvent.click(screen.getByRole("button", { name: "Login" })),
  };
};

test("пустая форма не отправляется и показывает ошибки", () => {
  const log = vi.spyOn(console, "log").mockImplementation(() => {});
  const { submit } = setup();

  submit();

  expect(screen.getAllByText("От 2 до 15 символов")).toHaveLength(2);
  expect(log).not.toHaveBeenCalled();
});

test("слишком длинное имя не проходит валидацию", () => {
  const { username, password, submit } = setup();

  fireEvent.change(username, { target: { value: "x".repeat(16) } });
  fireEvent.change(password, { target: { value: "secret" } });
  submit();

  expect(screen.getAllByText("От 2 до 15 символов")).toHaveLength(1);
});

test("корректная форма отправляет значения", () => {
  const log = vi.spyOn(console, "log").mockImplementation(() => {});
  const { username, password, submit } = setup();

  fireEvent.change(username, { target: { value: "admin" } });
  fireEvent.change(password, { target: { value: "admin" } });
  submit();

  expect(screen.queryByText("От 2 до 15 символов")).toBeNull();
  expect(log).toHaveBeenCalledWith({ username: "admin", password: "admin" });
});
