import { act } from "@testing-library/react";

// Заглушка сокета: запоминает обработчики, emit вызывает их, как это сделал бы сервер.
export const fakeSocket = () => {
  const handlers: Record<string, (payload: unknown) => void> = {};
  return {
    on: (event: string, handler: (payload: unknown) => void) => {
      handlers[event] = handler;
    },
    io: { on: () => {} },
    // TanStack Query уведомляет подписчиков на следующем тике — ждём его внутри act.
    emit: (event: string, payload: unknown) =>
      act(async () => {
        handlers[event]?.(payload);
        await new Promise((resolve) => setTimeout(resolve, 0));
      }),
  };
};
