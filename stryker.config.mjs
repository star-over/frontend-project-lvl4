// Мутационное тестирование по требованию (make mutation): только логика вне React —
// там мутанты дешёвые и осмысленные; интерфейс проверяют интеграционные тесты.
// Stryker находит тесты по имени, а @fast-check/vitest дописывает к имени случайный seed.
// Фиксированный seed (__tests__/setup.ts читает FC_SEED) делает имена стабильными между прогонами.
process.env.FC_SEED ??= "1";

/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
export default {
  testRunner: "vitest",
  mutate: ["src/api.ts", "src/channelName.ts", "src/profanity.ts", "src/stores/*.ts"],
  // Stryker переписывает tsconfig через JS API TypeScript, которого у TS 7 нет.
  // Нашему tsconfig переписывать нечего (ни extends, ни references), поэтому шаг отключён.
  tsconfigFile: "",
  reporters: ["clear-text", "progress", "html"],
  htmlReporter: { fileName: "reports/mutation/index.html" },
};
