import { create } from "zustand";

import { type Channel, useChannels } from "../api.ts";

export type Modal = { type: "add" } | { type: "rename" | "remove"; channel: Channel } | null;

type UiStore = {
  // Выбранный пользователем канал. Каким он стал на экране — решает useCurrentChannel.
  currentChannelId: string | null;
  setCurrentChannel: (id: string) => void;
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

// Текущий канал: выбранный, а если не выбран или удалён (своим запросом или событием сокета) —
// канал по умолчанию, первый в списке. undefined — каналы ещё не загружены.
export const useCurrentChannel = (): Channel | undefined => {
  const channels = useChannels().data ?? [];
  const currentChannelId = useUi((state) => state.currentChannelId);
  return channels.find(({ id }) => id === currentChannelId) ?? channels[0];
};
