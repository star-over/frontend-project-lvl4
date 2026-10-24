import filter from "leo-profanity";

// Встроенный словарь английский; русский добавляется к нему, а не заменяет
// (loadDictionary("ru") выкинул бы английские слова).
filter.add(filter.getDictionary("ru"));

// Нецензурное слово заменяется звёздочками той же длины. Слова выделяются здесь, а не
// в filter.clean: тот делит текст только по пробелам, запятым и точкам и пропускает «boobs!».
export const censor = (text: string) =>
  text.replace(/[\p{L}\p{N}]+(?:[-&][\p{L}\p{N}]+)*/gu, (word) =>
    filter.check(word) ? "*".repeat(word.length) : word,
  );
