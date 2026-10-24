// Все адреса — здесь: пути API и страниц строятся функциями, а не пишутся строками по коду.
const apiPath = "/api/v1";

export const apiRoutes = {
  login: () => `${apiPath}/login`,
  signup: () => `${apiPath}/signup`,
  channels: () => `${apiPath}/channels`,
  channel: (id: string) => `${apiPath}/channels/${id}`,
  messages: () => `${apiPath}/messages`,
};

export const pageRoutes = {
  chat: () => "/",
  login: () => "/login",
  signup: () => "/signup",
};
