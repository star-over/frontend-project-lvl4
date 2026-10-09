import { Button, PasswordInput, Stack, TextInput, Title } from "@mantine/core";
import { hasLength, useForm } from "@mantine/form";

export const LoginForm = () => {
  const form = useForm({
    mode: "uncontrolled",
    initialValues: { username: "", password: "" },
    validate: {
      username: hasLength({ min: 2, max: 15 }, "От 2 до 15 символов"),
      password: hasLength({ min: 2, max: 15 }, "От 2 до 15 символов"),
    },
  });

  // ponytail: отправка на /api/v1/login появится на шаге авторизации
  const onSubmit = form.onSubmit((values) => console.log(values));

  return (
    <form onSubmit={onSubmit} noValidate>
      <Stack>
        <Title order={1} ta="center">
          Login
        </Title>
        <TextInput
          required
          label="User Name"
          key={form.key("username")}
          {...form.getInputProps("username")}
        />
        <PasswordInput
          required
          label="Password"
          key={form.key("password")}
          {...form.getInputProps("password")}
        />
        <Button type="submit" fullWidth>
          Login
        </Button>
      </Stack>
    </form>
  );
};
