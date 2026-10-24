import { create } from "zustand";

import type { Channel } from "../api.ts";

export type Modal = { type: "add" } | { type: "rename" | "remove"; channel: Channel } | null;

type UiStore = {
  // null — канал не выбран или удалён, показывается канал по умолчанию (первый).
  currentChannelId: string | null;
  setCurrentChannel: (id: string | null) => void;
  modal: Modal;
  openModal: (modal: Modal) => void;
  closeModal: () => void;
};

export const useUi = create<UiStore>()((set) => ({
  currentChannelId: null,
  setCurrentChannel: (currentChannelId) => set({ currentChannelId }),
  modal: null,
  openModal: (modal) => set({ modal }),
  closeModal: () => set({ modal: null }),
}));
