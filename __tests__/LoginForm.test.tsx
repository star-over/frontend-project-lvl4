import { MantineProvider } from "@mantine/core";
import { createEvent, fireEvent, render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import { LoginForm } from "../src/components/LoginForm.tsx";

test("отправка формы не перезагружает страницу", () => {
  render(
    <MantineProvider>
      <LoginForm />
    </MantineProvider>,
  );
  const username = screen.getByLabelText<HTMLInputElement>("Ваш ник");
  fireEvent.change(username, { target: { value: "admin" } });

  const form = username.closest("form")!;
  const submit = createEvent.submit(form);
  fireEvent(form, submit);

  expect(submit.defaultPrevented).toBe(true);
  expect(username.value).toBe("admin");
});
