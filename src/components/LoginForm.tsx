import { Button, PasswordInput, Stack, TextInput, Title } from "@mantine/core";
import { useForm } from "@mantine/form";

export const LoginForm = () => {
  const form = useForm({
    mode: "uncontrolled",
    initialValues: { username: "", password: "" },
  });

  // ponytail: отправка на /api/v1/login появится на шаге авторизации
  const onSubmit = form.onSubmit(() => {});

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
        <Button type="submit" variant="outline" fullWidth>
          Войти
        </Button>
      </Stack>
    </form>
  );
};
