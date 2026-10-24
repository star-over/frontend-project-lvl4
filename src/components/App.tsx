import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { type QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { I18nextProvider } from "react-i18next";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { useStore } from "zustand";

import { i18n } from "../i18n.ts";
import { LoginPage } from "../pages/LoginPage.tsx";
import { MainPage } from "../pages/MainPage.tsx";
import { NotFoundPage } from "../pages/NotFoundPage.tsx";
import { SignupPage } from "../pages/SignupPage.tsx";
import { type Stores, StoresContext } from "../stores/context.ts";
import { NavMenu } from "./NavMenu.tsx";

// Стили подключаются здесь, а не в index.tsx: проверка монтирует приложение из init.
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";

// queryClient и хранилища создаёт init: обработчики сокета пишут в тот же кеш и уведомления.
// Поднимать App можно только через init — и в продакшене, и в тестах.
export const App = ({ queryClient, stores }: { queryClient: QueryClient; stores: Stores }) => {
  const user = useStore(stores.auth, (state) => state.user);
  // Конец сессии (выход или отозванный токен): всё клиентское состояние прежнего
  // пользователя сбрасывается — кэш запросов и UI (текущий канал, открытая модалка).
  useEffect(() => {
    if (user) return;
    queryClient.clear();
    stores.ui.setState(stores.ui.getInitialState());
  }, [user, queryClient, stores]);

  return (
    <I18nextProvider i18n={i18n}>
      <MantineProvider>
        <Notifications position="bottom-right" store={stores.notifications} />
        <QueryClientProvider client={queryClient}>
          <StoresContext value={stores}>
            <BrowserRouter>
              <NavMenu />
              <Routes>
                <Route path="/" element={user ? <MainPage /> : <Navigate to="/login" replace />} />
                <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
                <Route
                  path="/signup"
                  element={user ? <Navigate to="/" replace /> : <SignupPage />}
                />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </BrowserRouter>
          </StoresContext>
        </QueryClientProvider>
      </MantineProvider>
    </I18nextProvider>
  );
};
