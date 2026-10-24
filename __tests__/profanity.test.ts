import { fc, test } from "@fast-check/vitest";
import filter from "leo-profanity";
import { expect } from "vitest";

import { censor } from "../src/profanity.ts";

test("мат на английском и русском заменяется звёздочками той же длины", () => {
  expect(censor("boobs")).toBe("*****");
  expect(censor("ты блядь")).toBe("ты *****");
  expect(censor("(boobs) boobs! БЛЯДЬ?")).toBe("(*****) *****! *****?");
  // Слова через дефис и & из словаря проверяются целиком.
  expect(censor("g-spot, s&m")).toBe("******, ***");
  expect(censor("boobs-free")).toBe("*****-free");
  expect(censor("обычный текст, normal text")).toBe("обычный текст, normal text");
});

// Строки из слов словаря, обычных слов и разделителей — в любом регистре.
const dictionary = filter.list().filter((word) => /^[\p{L}\p{N}]+$/u.test(word));
const piece = fc.oneof(
  fc.constantFrom(...dictionary),
  fc.constantFrom("привет", "hello", "class", "ассистент", "42"),
  fc.constantFrom(" ", ",", ".", "!", "?", "(", ")", "-", "&", "«", "»", "\n"),
);
const text = fc
  .array(fc.tuple(piece, fc.boolean()), { maxLength: 12 })
  .map((pieces) => pieces.map(([p, upper]) => (upper ? p.toUpperCase() : p)).join(""));
const words = (s: string) => s.split(/[^\p{L}\p{N}]+/u).filter(Boolean);

test.prop([text])("длина и символы вне слов не меняются", (s) => {
  const censored = censor(s);
  expect(censored).toHaveLength(s.length);
  [...s].forEach((char, i) => {
    if (!/[\p{L}\p{N}]/u.test(char)) expect(censored[i]).toBe(char);
  });
});

test.prop([text])("ни одно слово из словаря не остаётся", (s) => {
  const survivors = words(censor(s)).filter((word) => dictionary.includes(word.toLowerCase()));
  expect(survivors).toEqual([]);
});
