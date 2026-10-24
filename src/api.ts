import { type QueryClient, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "./stores/auth.ts";
import { useUi } from "./stores/ui.ts";

export type Channel = { id: string; name: string; removable: boolean };
export type Message = { id: string; body: string; channelId: string; username: string };

const request = async <T>(method: string, path: string, body?: unknown): Promise<T> => {
  const token = useAuth.getState().user?.token;
  const response = await fetch(`/api/v1${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  // Токен отозван или протух: без выхода пользователь застрял бы на пустом чате.
  if (response.status === 401) {
    useAuth.getState().logOut();
  }
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
};

// Вход и регистрация. Успех — пользователь сохраняется, возвращается undefined;
// отказ сервера — его HTTP-статус (401, 409); сетевой сбой — исключение.
export const authenticate = async (
  path: "/login" | "/signup",
  credentials: { username: string; password: string },
): Promise<number | undefined> => {
  const response = await fetch(`/api/v1${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });
  if (!response.ok) return response.status;
  useAuth.getState().logIn(await response.json());
};

export const useChannels = () =>
  useQuery({ queryKey: ["channels"], queryFn: () => request<Channel[]>("GET", "/channels") });

export const useMessages = () =>
  useQuery({ queryKey: ["messages"], queryFn: () => request<Message[]>("GET", "/messages") });

// Сообщение приходит дважды: ответом на POST и событием сокета. Дубль отбрасывается по id.
export const addMessage = (queryClient: QueryClient, message: Message) =>
  queryClient.setQueryData<Message[]>(["messages"], (messages) =>
    messages && !messages.some(({ id }) => id === message.id) ? [...messages, message] : messages,
  );

// Изменения каналов тоже приходят и ответом на запрос, и событием сокета —
// обе ветки пишут в кеш одними и теми же функциями, повтор ничего не меняет.
export const addChannel = (queryClient: QueryClient, channel: Channel) =>
  queryClient.setQueryData<Channel[]>(["channels"], (channels) =>
    channels && !channels.some(({ id }) => id === channel.id) ? [...channels, channel] : channels,
  );

export const renameChannel = (queryClient: QueryClient, channel: Channel) =>
  queryClient.setQueryData<Channel[]>(["channels"], (channels) =>
    channels?.map((item) => (item.id === channel.id ? channel : item)),
  );

// Вместе с каналом уходят его сообщения; кто был в нём — попадает в канал по умолчанию.
export const removeChannel = (queryClient: QueryClient, { id }: Pick<Channel, "id">) => {
  queryClient.setQueryData<Channel[]>(["channels"], (channels) =>
    channels?.filter((channel) => channel.id !== id),
  );
  queryClient.setQueryData<Message[]>(["messages"], (messages) =>
    messages?.filter(({ channelId }) => channelId !== id),
  );
  if (useUi.getState().currentChannelId === id) {
    useUi.getState().setCurrentChannel(null);
  }
};

export const useAddChannel = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => request<Channel>("POST", "/channels", { name }),
    onSuccess: (channel) => {
      addChannel(queryClient, channel);
      useUi.getState().setCurrentChannel(channel.id);
    },
  });
};

export const useRenameChannel = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: Pick<Channel, "id" | "name">) =>
      request<Channel>("PATCH", `/channels/${id}`, { name }),
    onSuccess: (channel) => renameChannel(queryClient, channel),
  });
};

export const useRemoveChannel = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => request<Pick<Channel, "id">>("DELETE", `/channels/${id}`),
    onSuccess: (channel) => removeChannel(queryClient, channel),
  });
};

export const useSendMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (message: Omit<Message, "id">) => request<Message>("POST", "/messages", message),
    onSuccess: (message) => addMessage(queryClient, message),
  });
};
