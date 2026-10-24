import { useQuery } from "@tanstack/react-query";

import { useAuth } from "./stores/auth.ts";

export type Channel = { id: string; name: string; removable: boolean };
export type Message = { id: string; body: string; channelId: string; username: string };

const request = async <T>(path: string): Promise<T> => {
  const token = useAuth.getState().user?.token;
  const response = await fetch(`/api/v1${path}`, {
    headers: { Authorization: `Bearer ${token}` },
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
  useQuery({ queryKey: ["channels"], queryFn: () => request<Channel[]>("/channels") });

export const useMessages = () =>
  useQuery({ queryKey: ["messages"], queryFn: () => request<Message[]>("/messages") });
