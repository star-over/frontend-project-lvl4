import { Button, PasswordInput, Stack, TextInput, Title } from "@mantine/core";
import { hasLength, isNotEmpty, matchesField, useForm } from "@mantine/form";
import { useTranslation } from "react-i18next";

import { isHttpError, useAuthenticate } from "../api.ts";

export const SignupForm = () => {
  const { t } = useTranslation();
  const authenticate = useAuthenticate("signup");
  const required = isNotEmpty(t("errors.required"));
  const form = useForm({
    mode: "uncontrolled",
    initialValues: { username: "", password: "", confirmPassword: "" },
    validateInputOnBlur: true,
    validate: {
      username: (value) =>
        required(value) ?? hasLength({ min: 3, max: 20 }, t("errors.length"))(value),
      password: (value) =>
        required(value) ?? hasLength({ min: 6 }, t("signup.passwordLength"))(value),
      confirmPassword: (value, values) =>
        required(value) ?? matchesField("password", t("signup.passwordsMatch"))(value, values),
    },
  });

  // После регистрации на / переводит маршрут (App), сеть и прочие ошибки показывает слой
  // запросов; здесь — только занятое имя.
  const onSubmit = form.onSubmit(async ({ username, password }) => {
    try {
      await authenticate.mutateAsync({ username, password });
    } catch (error) {
      if (isHttpError(error, 409)) form.setFieldError("username", t("signup.userExists"));
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate>
      <Stack>
        <Title order={1} ta="center">
          {t("signup.title")}
        </Title>
        <TextInput
          label={t("signup.username")}
          autoComplete="username"
          key={form.key("username")}
          {...form.getInputProps("username")}
        />
        <PasswordInput
          label={t("signup.password")}
          autoComplete="new-password"
          key={form.key("password")}
          {...form.getInputProps("password")}
        />
        <PasswordInput
          label={t("signup.confirmPassword")}
          autoComplete="new-password"
          key={form.key("confirmPassword")}
          {...form.getInputProps("confirmPassword")}
        />
        <Button type="submit" variant="outline" fullWidth loading={form.submitting}>
          {t("signup.submit")}
        </Button>
      </Stack>
    </form>
  );
};
