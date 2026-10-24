import { expect, test } from "vitest";

import { censor } from "../src/profanity.ts";

test("мат на английском и русском заменяется звёздочками той же длины", () => {
  expect(censor("boobs")).toBe("*****");
  expect(censor("ты блядь")).toBe("ты *****");
  expect(censor("(boobs) boobs! БЛЯДЬ?")).toBe("(*****) *****! *****?");
  expect(censor("обычный текст, normal text")).toBe("обычный текст, normal text");
});
