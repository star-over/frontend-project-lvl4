import { Anchor, Text } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import logo from "../assets/Login.jpeg";
import { AuthCard } from "../components/AuthCard.tsx";
import { LoginForm } from "../components/LoginForm.tsx";

export const LoginPage = () => {
  const { t } = useTranslation();

  return (
    <AuthCard
      image={logo}
      alt={t("login.image")}
      footer={
        <Text ta="center">
          {t("login.noAccount")}{" "}
          <Anchor component={Link} to="/signup">
            {t("login.signupLink")}
          </Anchor>
        </Text>
      }
    >
      <LoginForm />
    </AuthCard>
  );
};
