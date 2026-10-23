import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";

import { LoginPage } from "../pages/LoginPage.tsx";
import { MainPage } from "../pages/MainPage.tsx";
import { NotFoundPage } from "../pages/NotFoundPage.tsx";
import { SignupPage } from "../pages/SignupPage.tsx";
import { useAuth } from "../stores/auth.ts";
import { NavMenu } from "./NavMenu.tsx";

// Стили подключаются здесь, а не в index.tsx: проверка монтирует приложение из init.
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";

export const App = () => {
  const user = useAuth((state) => state.user);

  return (
    <MantineProvider>
      <Notifications position="bottom-right" />
      <BrowserRouter>
        <NavMenu />
        <Routes>
          <Route path="/" element={user ? <MainPage /> : <Navigate to="/login" replace />} />
          <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </MantineProvider>
  );
};
