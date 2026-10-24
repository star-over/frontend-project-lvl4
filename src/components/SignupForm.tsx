import { Button, PasswordInput, Stack, TextInput, Title } from "@mantine/core";
import { hasLength, isNotEmpty, matchesField, useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import { authenticate } from "../api.ts";

export const SignupForm = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
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

  const onSubmit = form.onSubmit(async ({ username, password }) => {
    let status: number | undefined;
    try {
      status = await authenticate("/signup", { username, password });
    } catch {
      notifications.show({ color: "red", message: t("errors.network") });
      return;
    }

    if (status === 409) {
      form.setFieldError("username", t("signup.userExists"));
      return;
    }
    if (status) {
      notifications.show({ color: "red", message: t("errors.network") });
      return;
    }
    navigate("/");
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
