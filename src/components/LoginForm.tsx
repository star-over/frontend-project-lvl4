import { Button, PasswordInput, Stack, TextInput, Title } from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { useNavigate } from "react-router";

import { authenticate } from "../api.ts";

type Credentials = { username: string; password: string };

export const LoginForm = () => {
  const navigate = useNavigate();
  const form = useForm<Credentials>({
    mode: "uncontrolled",
    initialValues: { username: "", password: "" },
  });

  const onSubmit = form.onSubmit(async (values) => {
    let status: number | undefined;
    try {
      status = await authenticate("/login", values);
    } catch {
      notifications.show({ color: "red", message: "Ошибка соединения" });
      return;
    }

    if (status === 401) {
      form.setFieldError("password", "Неверные имя пользователя или пароль");
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
