import { createTheme, MantineProvider, Text } from "@mantine/core";
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
import { pageRoutes } from "../routes.ts";
import { type Stores, StoresContext } from "../stores/context.ts";
import { NavMenu } from "./NavMenu.tsx";

// Стили подключаются здесь, а не в index.tsx: проверка монтирует приложение из init.
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";

// Свой CSS не пишется — оформление задаёт тема. Длинное слово без пробелов
// (сообщение, имя канала) переносится, а не распирает вёрстку.
const theme = createTheme({
  components: { Text: Text.extend({ styles: { root: { overflowWrap: "anywhere" } } }) },
});

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
      <MantineProvider theme={theme}>
        <Notifications position="bottom-right" store={stores.notifications} />
        <QueryClientProvider client={queryClient}>
          <StoresContext value={stores}>
            <BrowserRouter>
              <NavMenu />
              <Routes>
                <Route
                  path={pageRoutes.chat()}
                  element={user ? <MainPage /> : <Navigate to={pageRoutes.login()} replace />}
                />
                <Route
                  path={pageRoutes.login()}
                  element={user ? <Navigate to={pageRoutes.chat()} replace /> : <LoginPage />}
                />
                <Route
                  path={pageRoutes.signup()}
                  element={user ? <Navigate to={pageRoutes.chat()} replace /> : <SignupPage />}
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
