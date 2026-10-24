import filter from "leo-profanity";

// Встроенный словарь английский; русский добавляется к нему, а не заменяет
// (loadDictionary("ru") выкинул бы английские слова).
filter.add(filter.getDictionary("ru"));

// Нецензурное слово заменяется звёздочками той же длины.
export const censor = (text: string) => filter.clean(text);
