import { create } from "zustand";
import { persist } from "zustand/middleware";

type Auth = { token: string; username: string };

type AuthStore = {
  user: Auth | null;
  logIn: (user: Auth) => void;
  logOut: () => void;
};

// persist кладёт состояние в localStorage, поэтому токен переживает перезагрузку.
export const useAuth = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      logIn: (user) => set({ user }),
      logOut: () => set({ user: null }),
    }),
    { name: "auth", partialize: ({ user }) => ({ user }) },
  ),
);
