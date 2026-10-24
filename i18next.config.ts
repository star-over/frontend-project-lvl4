import { defineConfig } from "i18next-cli";

// Ключи вынимаются из вызовов t() в коде (`make i18n-extract`), а не правятся руками.
// `make test` гоняет `lint` (захардкоженные строки) и `status` (ключи без перевода).
export default defineConfig({
  locales: ["ru"],
  extract: {
    input: ["src/**/*.{ts,tsx}"],
    output: "src/locales/{{language}}/{{namespace}}.json",
    defaultNS: "translation",
    primaryLanguage: "ru",
  },
});
