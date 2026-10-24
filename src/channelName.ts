import { censor } from "./profanity.ts";

// Имя канала уходит на сервер таким: без пробелов по краям и без мата.
export const normalizeChannelName = (name: string) => censor(name.trim());

// Что не так с именем канала: длина вне 3–20 или совпадение с существующим.
// Уникальность — по нормализованному имени: оно и уйдёт на сервер.
export const channelNameError = (name: string, existing: string[]) => {
  const { length } = name.trim();
  if (length < 3 || length > 20) return "length";
  if (existing.includes(normalizeChannelName(name))) return "unique";
  return null;
};
