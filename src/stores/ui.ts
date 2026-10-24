import { create } from "zustand";

type UiStore = {
  // null — ещё не выбран, показывается первый канал.
  currentChannelId: string | null;
  setCurrentChannel: (id: string) => void;
};

export const useUi = create<UiStore>()((set) => ({
  currentChannelId: null,
  setCurrentChannel: (currentChannelId) => set({ currentChannelId }),
}));
