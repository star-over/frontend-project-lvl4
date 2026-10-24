import { Button, PasswordInput, Stack, TextInput, Title } from "@mantine/core";
import { hasLength, isNotEmpty, matchesField, useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { useNavigate } from "react-router";

import { authenticate } from "../api.ts";

const required = isNotEmpty("Обязательное поле");

export const SignupForm = () => {
  const navigate = useNavigate();
  const form = useForm({
    mode: "uncontrolled",
    initialValues: { username: "", password: "", confirmPassword: "" },
    validateInputOnBlur: true,
    validate: {
      username: (value) =>
        required(value) ?? hasLength({ min: 3, max: 20 }, "От 3 до 20 символов")(value),
      password: (value) => required(value) ?? hasLength({ min: 6 }, "Не менее 6 символов")(value),
      confirmPassword: (value, values) =>
        required(value) ?? matchesField("password", "Пароли должны совпадать")(value, values),
    },
  });

  const onSubmit = form.onSubmit(async ({ username, password }) => {
    let status: number | undefined;
    try {
      status = await authenticate("/signup", { username, password });
    } catch {
      notifications.show({ color: "red", message: "Ошибка соединения" });
      return;
    }

    if (status === 409) {
      form.setFieldError("username", "Такой пользователь уже существует");
      return;
    }
    if (status) {
      notifications.show({ color: "red", message: "Ошибка соединения" });
      return;
    }
    navigate("/");
  });

  return (
    <form onSubmit={onSubmit} noValidate>
      <Stack>
        <Title order={1} ta="center">
          Регистрация
        </Title>
        <TextInput
          label="Имя пользователя"
          autoComplete="username"
          key={form.key("username")}
          {...form.getInputProps("username")}
        />
        <PasswordInput
          label="Пароль"
          autoComplete="new-password"
          key={form.key("password")}
          {...form.getInputProps("password")}
        />
        <PasswordInput
          label="Подтвердите пароль"
          autoComplete="new-password"
          key={form.key("confirmPassword")}
          {...form.getInputProps("confirmPassword")}
        />
        <Button type="submit" variant="outline" fullWidth loading={form.submitting}>
          Зарегистрироваться
        </Button>
      </Stack>
    </form>
  );
};
