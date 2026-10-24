import { Button, PasswordInput, Stack, TextInput, Title } from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import { authenticate } from "../api.ts";

type Credentials = { username: string; password: string };

export const LoginForm = () => {
  const { t } = useTranslation();
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
      notifications.show({ color: "red", message: t("errors.network") });
      return;
    }

    if (status === 401) {
      form.setFieldError("password", t("login.invalid"));
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
