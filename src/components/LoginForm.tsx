import { Button, PasswordInput, Stack, TextInput, Title } from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { useNavigate } from "react-router";

import { useAuth } from "../stores/auth.ts";

type Credentials = { username: string; password: string };

export const LoginForm = () => {
  const logIn = useAuth((state) => state.logIn);
  const navigate = useNavigate();
  const form = useForm<Credentials>({
    mode: "uncontrolled",
    initialValues: { username: "", password: "" },
  });

  const onSubmit = form.onSubmit(async (values) => {
    let response: Response;
    try {
      response = await fetch("/api/v1/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
    } catch {
      notifications.show({ color: "red", message: "Ошибка соединения" });
      return;
    }

    if (response.status === 401) {
      form.setFieldError("password", "Неверные имя пользователя или пароль");
      return;
    }
    if (!response.ok) {
      notifications.show({ color: "red", message: "Ошибка соединения" });
      return;
    }

    logIn(await response.json());
    navigate("/");
  });

  return (
    <form onSubmit={onSubmit} noValidate>
      <Stack>
        <Title order={1} ta="center">
          Войти
        </Title>
        <TextInput
          label="Ваш ник"
          autoComplete="username"
          key={form.key("username")}
          {...form.getInputProps("username")}
        />
        <PasswordInput
          label="Пароль"
          autoComplete="current-password"
          key={form.key("password")}
          {...form.getInputProps("password")}
        />
        <Button type="submit" variant="outline" fullWidth loading={form.submitting}>
          Войти
        </Button>
      </Stack>
    </form>
  );
};
