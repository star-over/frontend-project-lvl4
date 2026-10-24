import { Anchor, Text } from "@mantine/core";
import { Link } from "react-router";

import logo from "../assets/Login.jpeg";
import { AuthCard } from "../components/AuthCard.tsx";
import { LoginForm } from "../components/LoginForm.tsx";

export const LoginPage = () => (
  <AuthCard
    image={logo}
    alt="login"
    footer={
      <Text ta="center">
        Нет аккаунта?{" "}
        <Anchor component={Link} to="/signup">
          Регистрация
        </Anchor>
      </Text>
    }
  >
    <LoginForm />
  </AuthCard>
);
