import type { NotificationsStore } from "@mantine/notifications";
import { createContext, useContext } from "react";

import type { AuthStoreApi } from "./auth.ts";
import type { UiStoreApi } from "./ui.ts";

// Хранилища клиентского состояния создаёт init, на каждый запуск свои: на уровне модуля
// они донесли бы вход, текущий канал и уведомления до следующего запуска.
export type Stores = { auth: AuthStoreApi; ui: UiStoreApi; notifications: NotificationsStore };

export const StoresContext = createContext<Stores | null>(null);

export const useStores = () => {
  const stores = useContext(StoresContext);
  if (!stores) throw new Error("Хранилища доступны только внутри App из init");
  return stores;
};
