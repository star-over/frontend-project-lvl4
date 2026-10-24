import i18next from "i18next";
import { initReactI18next } from "react-i18next";

// Словарь собирает i18next-cli из вызовов t() (`make i18n-extract`, настройки — i18next.config.ts).
import ru from "./locales/ru/translation.json";

// Ключи переводов проверяет TypeScript: опечатка в ключе — ошибка сборки.
declare module "i18next" {
  interface CustomTypeOptions {
    resources: { translation: typeof ru };
  }
}

// Язык фиксирован — ru, без автоопределения: на это рассчитаны автотесты Хекслета.
// Ресурсы встроены, поэтому инициализация синхронная и переводы готовы сразу.
export const i18n = i18next.createInstance();

i18n.use(initReactI18next).init({
  resources: { ru: { translation: ru } },
  lng: "ru",
  fallbackLng: "ru",
  interpolation: { escapeValue: false },
  initAsync: false,
});
