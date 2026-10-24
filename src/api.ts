import { type NotificationsStore, notifications } from "@mantine/notifications";
import {
  MutationCache,
  QueryCache,
  QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { i18n } from "./i18n.ts";
import { apiRoutes } from "./routes.ts";
import type { AuthStoreApi } from "./stores/auth.ts";
import { useStores } from "./stores/context.ts";

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
const request = async <T>(
  auth: AuthStoreApi,
  method: string,
  path: string,
  body?: unknown,
): Promise<T> => {
  const token = auth.getState().user?.token;
  const response = await fetch(path, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  // Токен отозван или протух: без выхода пользователь застрял бы на пустом чате.
  if (response.status === 401) {
    auth.getState().logOut();
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
export const useAuthenticate = (action: "login" | "signup") => {
  const { auth } = useStores();
  return useMutation({
    mutationFn: (credentials: Credentials) =>
      request<{ token: string; username: string }>(auth, "POST", apiRoutes[action](), credentials),
    onSuccess: (user) => auth.getState().logIn(user),
    meta: { expectedStatus: action === "login" ? 401 : 409 },
  });
};

// Успех мутации каналов — зелёное уведомление в хранилище уведомлений этого запуска.
const useNotifySuccess = () => {
  const store = useStores().notifications;
  return (message: string) => notifications.show({ color: "green", message }, store);
};

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
export const createQueryClient = (store: NotificationsStore) =>
  new QueryClient({
    defaultOptions: { queries: { retry: 1, staleTime: Infinity } },
    queryCache: new QueryCache({
      onError: () =>
        notifications.show(
          { id: "loading-error", color: "red", message: i18n.t("errors.loading") },
          store,
        ),
    }),
    mutationCache: new MutationCache({
      onError: (error, _variables, _context, mutation) => {
        const expected = mutation.meta?.expectedStatus;
        if (expected && isHttpError(error, expected)) return;
        notifications.show({ color: "red", message: i18n.t("errors.network") }, store);
      },
    }),
  });

export const useChannels = () => {
  const { auth } = useStores();
  return useQuery({
    queryKey: channelsKey,
    queryFn: () => request<Channel[]>(auth, "GET", apiRoutes.channels()),
  });
};

export const useMessages = () => {
  const { auth } = useStores();
  return useQuery({
    queryKey: messagesKey,
    queryFn: () => request<Message[]>(auth, "GET", apiRoutes.messages()),
  });
};

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
  const { auth } = useStores();
  const notifySuccess = useNotifySuccess();
  return useMutation({
    mutationFn: (name: string) => request<Channel>(auth, "POST", apiRoutes.channels(), { name }),
    onSuccess: (channel) => {
      addChannel(queryClient, channel);
      notifySuccess(i18n.t("channels.toasts.added"));
    },
  });
};

export const useRenameChannel = () => {
  const queryClient = useQueryClient();
  const { auth } = useStores();
  const notifySuccess = useNotifySuccess();
  return useMutation({
    mutationFn: ({ id, name }: Pick<Channel, "id" | "name">) =>
      request<Channel>(auth, "PATCH", apiRoutes.channel(id), { name }),
    onSuccess: (channel) => {
      renameChannel(queryClient, channel);
      notifySuccess(i18n.t("channels.toasts.renamed"));
    },
  });
};

export const useRemoveChannel = () => {
  const queryClient = useQueryClient();
  const { auth } = useStores();
  const notifySuccess = useNotifySuccess();
  return useMutation({
    mutationFn: (id: string) => request<Pick<Channel, "id">>(auth, "DELETE", apiRoutes.channel(id)),
    onSuccess: (channel) => {
      removeChannel(queryClient, channel);
      notifySuccess(i18n.t("channels.toasts.removed"));
    },
  });
};

export const useSendMessage = () => {
  const queryClient = useQueryClient();
  const { auth } = useStores();
  return useMutation({
    mutationFn: (message: Omit<Message, "id">) =>
      request<Message>(auth, "POST", apiRoutes.messages(), message),
    onSuccess: (message) => addMessage(queryClient, message),
  });
};
