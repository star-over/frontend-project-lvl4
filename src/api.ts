import { type QueryClient, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "./stores/auth.ts";

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

export const useChannels = () =>
  useQuery({ queryKey: ["channels"], queryFn: () => request<Channel[]>("GET", "/channels") });

export const useMessages = () =>
  useQuery({ queryKey: ["messages"], queryFn: () => request<Message[]>("GET", "/messages") });

// Сообщение приходит дважды: ответом на POST и событием сокета. Дубль отбрасывается по id.
export const addMessage = (queryClient: QueryClient, message: Message) =>
  queryClient.setQueryData<Message[]>(["messages"], (messages) =>
    messages && !messages.some(({ id }) => id === message.id) ? [...messages, message] : messages,
  );

export const useSendMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (message: Omit<Message, "id">) => request<Message>("POST", "/messages", message),
    onSuccess: (message) => addMessage(queryClient, message),
  });
};
