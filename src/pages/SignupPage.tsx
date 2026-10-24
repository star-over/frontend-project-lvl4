import { useTranslation } from "react-i18next";

import logo from "../assets/Signup.jpg";
import { AuthCard } from "../components/AuthCard.tsx";
import { SignupForm } from "../components/SignupForm.tsx";

export const SignupPage = () => {
  const { t } = useTranslation();

  return (
    <AuthCard image={logo} alt={t("signup.image")}>
      <SignupForm />
    </AuthCard>
  );
};
