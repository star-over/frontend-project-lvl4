import * as Sentry from "@sentry/react";
import { createRoot } from "react-dom/client";
import { io } from "socket.io-client";

import init from "./init.tsx";

// Коллектор ошибок (Bugsink принимает события Sentry SDK). DSN приходит из окружения
// на этапе сборки (VITE_SENTRY_DSN, на Render — переменная сервиса); без него
// коллектор выключен — локальная разработка и тесты ничего не отправляют.
// Подключается здесь, а не в init: проверки Хекслета зовут init напрямую.
const dsn = import.meta.env.VITE_SENTRY_DSN;
if (dsn) {
  Sentry.init({ dsn, environment: import.meta.env.MODE });
}

// Ошибки рендера React тоже уходят в коллектор: сам Sentry.init ловит только глобальные.
const root = createRoot(document.getElementById("chat")!, {
  onUncaughtError: Sentry.reactErrorHandler(),
  onCaughtError: Sentry.reactErrorHandler(),
  onRecoverableError: Sentry.reactErrorHandler(),
});
root.render(await init(io()));
