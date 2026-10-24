import { expect, test } from "vitest";

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
