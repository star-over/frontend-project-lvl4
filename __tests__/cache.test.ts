import { fc, test } from "@fast-check/vitest";
import { QueryClient } from "@tanstack/react-query";
import { expect } from "vitest";

import {
  addChannel,
  addMessage,
  type Channel,
  type Message,
  removeChannel,
  renameChannel,
} from "../src/api.ts";

// События, которыми ответы на запросы и сокет правят кеш. id из короткого списка —
// чтобы чаще совпадали и проверялись дубли, переименование и удаление существующего.
const id = fc.constantFrom("1", "2", "3", "4");
const channel = fc.record({ id, name: fc.string(), removable: fc.boolean() });
const event = fc.oneof(
  fc.record({ type: fc.constant("newChannel" as const), channel }),
  fc.record({ type: fc.constant("renameChannel" as const), channel }),
  fc.record({ type: fc.constant("removeChannel" as const), id }),
  fc.record({
    type: fc.constant("newMessage" as const),
    message: fc.record({ id, body: fc.string(), channelId: id, username: fc.string() }),
  }),
);
type Event = typeof event extends fc.Arbitrary<infer T> ? T : never;

const apply = (queryClient: QueryClient, e: Event) => {
  if (e.type === "newChannel") addChannel(queryClient, e.channel);
  if (e.type === "renameChannel") renameChannel(queryClient, e.channel);
  if (e.type === "removeChannel") removeChannel(queryClient, e);
  if (e.type === "newMessage") addMessage(queryClient, e.message);
};

const loadedClient = () => {
  const queryClient = new QueryClient();
  queryClient.setQueryData<Channel[]>(["channels"], []);
  queryClient.setQueryData<Message[]>(["messages"], []);
  return queryClient;
};

const cache = (queryClient: QueryClient) => ({
  channels: queryClient.getQueryData<Channel[]>(["channels"])!,
  messages: queryClient.getQueryData<Message[]>(["messages"])!,
});

test.prop([fc.array(event)])("событие, пришедшее дважды, меняет кеш как одно", (events) => {
  const once = loadedClient();
  const twice = loadedClient();
  for (const e of events) {
    apply(once, e);
    apply(twice, e);
    apply(twice, e);
  }
  expect(cache(twice)).toEqual(cache(once));
});

test.prop([fc.array(event)])("id каналов и сообщений в кеше не повторяются", (events) => {
  const queryClient = loadedClient();
  for (const e of events) apply(queryClient, e);
  const { channels, messages } = cache(queryClient);
  expect(new Set(channels.map((c) => c.id)).size).toBe(channels.length);
  expect(new Set(messages.map((m) => m.id)).size).toBe(messages.length);
});

test.prop([fc.array(event), id])(
  "после удаления канала нет ни его, ни его сообщений",
  (events, removed) => {
    const queryClient = loadedClient();
    for (const e of events) apply(queryClient, e);
    removeChannel(queryClient, { id: removed });
    const { channels, messages } = cache(queryClient);
    expect(channels.some((c) => c.id === removed)).toBe(false);
    expect(messages.some((m) => m.channelId === removed)).toBe(false);
  },
);

test.prop([fc.array(event)])("до загрузки кеша события его не создают", (events) => {
  const queryClient = new QueryClient();
  for (const e of events) apply(queryClient, e);
  expect(cache(queryClient)).toEqual({ channels: undefined, messages: undefined });
});
