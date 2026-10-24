import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { type QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { I18nextProvider } from "react-i18next";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";

import { i18n } from "../i18n.ts";
import { LoginPage } from "../pages/LoginPage.tsx";
import { MainPage } from "../pages/MainPage.tsx";
import { NotFoundPage } from "../pages/NotFoundPage.tsx";
import { SignupPage } from "../pages/SignupPage.tsx";
import { useAuth } from "../stores/auth.ts";
import { NavMenu } from "./NavMenu.tsx";

// Стили подключаются здесь, а не в index.tsx: проверка монтирует приложение из init.
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";

// queryClient создаёт init, чтобы обработчики сокета писали в тот же кеш.
// Поднимать App можно только через init — и в продакшене, и в тестах.
export const App = ({ queryClient }: { queryClient: QueryClient }) => {
  const user = useAuth((state) => state.user);
  // После выхода кеш чистится, чтобы следующий пользователь не увидел чужие данные.
  useEffect(() => {
    if (!user) queryClient.clear();
  }, [user, queryClient]);

  return (
    <I18nextProvider i18n={i18n}>
      <MantineProvider>
        <Notifications position="bottom-right" />
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <NavMenu />
            <Routes>
              <Route path="/" element={user ? <MainPage /> : <Navigate to="/login" replace />} />
              <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
              <Route path="/signup" element={user ? <Navigate to="/" replace /> : <SignupPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </BrowserRouter>
        </QueryClientProvider>
      </MantineProvider>
    </I18nextProvider>
  );
};
