import logo from "../assets/Signup.jpg";
import { AuthCard } from "../components/AuthCard.tsx";
import { SignupForm } from "../components/SignupForm.tsx";

export const SignupPage = () => (
  <AuthCard image={logo} alt="signup">
    <SignupForm />
  </AuthCard>
);
