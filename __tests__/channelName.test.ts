import { fc, test } from "@fast-check/vitest";
import { expect } from "vitest";

import { channelNameError, normalizeChannelName } from "../src/channelName.ts";

const existing = ["general", "random", "*****"];

test.each([
  ["ab", "length"],
  ["  ab  ", "length"],
  ["abc", null],
  ["x".repeat(20), null],
  [` ${"x".repeat(20)} `, null],
  ["x".repeat(21), "length"],
  ["random", "unique"],
  ["  random ", "unique"],
  ["bitch", "unique"],
  ["Random", null],
])("%j → %s", (name, error) => {
  expect(channelNameError(name, existing)).toBe(error);
});

test("нормализованное имя: без пробелов по краям и без мата", () => {
  expect(normalizeChannelName("  new channel  ")).toBe("new channel");
  expect(normalizeChannelName(" boobs! ")).toBe("*****!");
});

test.prop([fc.string()])("ошибка длины — ровно когда имя без краевых пробелов вне 3–20", (name) => {
  const { length } = name.trim();
  expect(channelNameError(name, []) === "length").toBe(length < 3 || length > 20);
});

test.prop([fc.string()])("нормализация повторно ничего не меняет и сохраняет длину", (name) => {
  const normalized = normalizeChannelName(name);
  expect(normalizeChannelName(normalized)).toBe(normalized);
  expect(normalized).toHaveLength(name.trim().length);
});

test.prop([fc.string({ minLength: 3, maxLength: 20 }).filter((s) => s.trim() === s)])(
  "имя, уже занятое после нормализации, — не уникально",
  (name) => {
    expect(channelNameError(name, [normalizeChannelName(name)])).toBe("unique");
  },
);
