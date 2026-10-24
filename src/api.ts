import { notifications } from "@mantine/notifications";
import {
  MutationCache,
  QueryCache,
  QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { i18n } from "./i18n.ts";
import { useAuth } from "./stores/auth.ts";

export type Channel = { id: string; name: string; removable: boolean };
export type Message = { id: string; body: string; channelId: string; username: string };

const channelsKey = ["channels"];
const messagesKey = ["messages"];

// Отказ сервера: статус ответа доступен вызывающему (например, 401 на входе, 409 на регистрации).
export class HttpError extends Error {
  constructor(readonly status: number) {
    super(`HTTP ${status}`);
  }
}

export const isHttpError = (error: unknown, status: number) =>
  error instanceof HttpError && error.status === status;

// Мутация может пометить ожидаемый отказ: его разбирает форма, общее уведомление не нужно.
declare module "@tanstack/react-query" {
  interface Register {
    mutationMeta: { expectedStatus?: number };
  }
}

// Все запросы к серверу. Токен прикладывается, когда пользователь вошёл.
const request = async <T>(method: string, path: string, body?: unknown): Promise<T> => {
  const token = useAuth.getState().user?.token;
  const response = await fetch(`/api/v1${path}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  // Токен отозван или протух: без выхода пользователь застрял бы на пустом чате.
  if (response.status === 401) {
    useAuth.getState().logOut();
  }
  if (!response.ok) {
    throw new HttpError(response.status);
  }
  return response.json();
};

type Credentials = { username: string; password: string };

// Вход и регистрация. Успех — пользователь сохранён. Ожидаемый отказ (неверный пароль —
// 401, имя занято — 409) приходит вызывающему как HttpError без общего уведомления;
// сеть и прочие ошибки — «Ошибка соединения», как у всех мутаций.
export const useAuthenticate = (path: "/login" | "/signup") =>
  useMutation({
    mutationFn: (credentials: Credentials) =>
      request<{ token: string; username: string }>("POST", path, credentials),
    onSuccess: (user) => useAuth.getState().logIn(user),
    meta: { expectedStatus: path === "/login" ? 401 : 409 },
  });

const notifySuccess = (message: string) => notifications.show({ color: "green", message });

// Обратная связь по серверу собрана здесь, вызывающим её повторять не нужно:
// - неудачная загрузка данных — «Ошибка загрузки данных» (id не даёт уведомлениям множиться,
//   когда падают оба запроса);
// - неудачная мутация (отправка, каналы) — «Ошибка соединения»; вызывающий только решает,
//   что делать с формой, — исключение из mutateAsync он гасит сам.
// Один повтор запроса вместо трёх: ошибка видна через секунду, а не через семь;
// после обрыва связи данные и так перечитываются по reconnect сокета.
// Данные не устаревают сами (staleTime: Infinity): изменения приходят событиями сокета,
// а пропущенные — перечитываются по reconnect. Иначе каждый новый подписчик на
// useChannels/useMessages перезапрашивал бы сервер.
export const createQueryClient = () =>
  new QueryClient({
    defaultOptions: { queries: { retry: 1, staleTime: Infinity } },
    queryCache: new QueryCache({
      onError: () =>
        notifications.show({
          id: "loading-error",
          color: "red",
          message: i18n.t("errors.loading"),
        }),
    }),
    mutationCache: new MutationCache({
      onError: (error, _variables, _context, mutation) => {
        const expected = mutation.meta?.expectedStatus;
        if (expected && isHttpError(error, expected)) return;
        notifications.show({ color: "red", message: i18n.t("errors.network") });
      },
    }),
  });

export const useChannels = () =>
  useQuery({ queryKey: channelsKey, queryFn: () => request<Channel[]>("GET", "/channels") });

export const useMessages = () =>
  useQuery({ queryKey: messagesKey, queryFn: () => request<Message[]>("GET", "/messages") });

// Сообщение приходит дважды: ответом на POST и событием сокета. Дубль отбрасывается по id.
export const addMessage = (queryClient: QueryClient, message: Message) =>
  queryClient.setQueryData<Message[]>(messagesKey, (messages) =>
    messages && !messages.some(({ id }) => id === message.id) ? [...messages, message] : messages,
  );

// Изменения каналов тоже приходят и ответом на запрос, и событием сокета —
// обе ветки пишут в кеш одними и теми же функциями, повтор ничего не меняет.
export const addChannel = (queryClient: QueryClient, channel: Channel) =>
  queryClient.setQueryData<Channel[]>(channelsKey, (channels) =>
    channels && !channels.some(({ id }) => id === channel.id) ? [...channels, channel] : channels,
  );

export const renameChannel = (queryClient: QueryClient, channel: Channel) =>
  queryClient.setQueryData<Channel[]>(channelsKey, (channels) =>
    channels?.map((item) => (item.id === channel.id ? channel : item)),
  );

// Вместе с каналом уходят его сообщения. Кто был в нём, попадает в канал по умолчанию
// без участия кэша — это правило useCurrentChannel.
export const removeChannel = (queryClient: QueryClient, { id }: Pick<Channel, "id">) => {
  queryClient.setQueryData<Channel[]>(channelsKey, (channels) =>
    channels?.filter((channel) => channel.id !== id),
  );
  queryClient.setQueryData<Message[]>(messagesKey, (messages) =>
    messages?.filter(({ channelId }) => channelId !== id),
  );
};

export const useAddChannel = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => request<Channel>("POST", "/channels", { name }),
    onSuccess: (channel) => {
      addChannel(queryClient, channel);
      notifySuccess(i18n.t("channels.toasts.added"));
    },
  });
};

export const useRenameChannel = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: Pick<Channel, "id" | "name">) =>
      request<Channel>("PATCH", `/channels/${id}`, { name }),
    onSuccess: (channel) => {
      renameChannel(queryClient, channel);
      notifySuccess(i18n.t("channels.toasts.renamed"));
    },
  });
};

export const useRemoveChannel = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => request<Pick<Channel, "id">>("DELETE", `/channels/${id}`),
    onSuccess: (channel) => {
      removeChannel(queryClient, channel);
      notifySuccess(i18n.t("channels.toasts.removed"));
    },
  });
};

export const useSendMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (message: Omit<Message, "id">) => request<Message>("POST", "/messages", message),
    onSuccess: (message) => addMessage(queryClient, message),
  });
};
