import { useStore } from "zustand";
import { persist } from "zustand/middleware";
import { createStore } from "zustand/vanilla";

import { useStores } from "./context.ts";

type Auth = { token: string; username: string };

export type AuthStore = {
  user: Auth | null;
  logIn: (user: Auth) => void;
  logOut: () => void;
};

// persist кладёт состояние в localStorage, поэтому токен переживает перезагрузку:
// новое хранилище сразу читает его оттуда.
export const createAuthStore = () =>
  createStore<AuthStore>()(
    persist(
      (set) => ({
        user: null,
        logIn: (user) => set({ user }),
        logOut: () => set({ user: null }),
      }),
      { name: "auth", partialize: ({ user }) => ({ user }) },
    ),
  );

export type AuthStoreApi = ReturnType<typeof createAuthStore>;

export const useAuth = <T>(selector: (state: AuthStore) => T) =>
  useStore(useStores().auth, selector);
