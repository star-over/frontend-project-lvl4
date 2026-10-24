import { Button, PasswordInput, Stack, TextInput, Title } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useTranslation } from "react-i18next";

import { isHttpError, useAuthenticate } from "../api.ts";

type Credentials = { username: string; password: string };

export const LoginForm = () => {
  const { t } = useTranslation();
  const authenticate = useAuthenticate("/login");
  const form = useForm<Credentials>({
    mode: "uncontrolled",
    initialValues: { username: "", password: "" },
  });

  // После входа на / переводит маршрут (App), сеть и прочие ошибки показывает слой запросов;
  // здесь — только неверный пароль.
  const onSubmit = form.onSubmit(async (values) => {
    try {
      await authenticate.mutateAsync(values);
    } catch (error) {
      if (isHttpError(error, 401)) form.setFieldError("password", t("login.invalid"));
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate>
      <Stack>
        <Title order={1} ta="center">
          {t("login.title")}
        </Title>
        <TextInput
          label={t("login.username")}
          autoComplete="username"
          key={form.key("username")}
          {...form.getInputProps("username")}
        />
        <PasswordInput
          label={t("login.password")}
          autoComplete="current-password"
          key={form.key("password")}
          {...form.getInputProps("password")}
        />
        <Button type="submit" variant="outline" fullWidth loading={form.submitting}>
          {t("login.submit")}
        </Button>
      </Stack>
    </form>
  );
};
