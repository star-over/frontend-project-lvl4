import { QueryClient } from "@tanstack/react-query";
import type { Socket } from "socket.io-client";

import { addChannel, addMessage, removeChannel, renameChannel } from "./api.ts";
import { App } from "./components/App.tsx";

// Сокет приходит параметром, открывает его точка входа: проверка проекта
// зовёт init со своим сокетом и рендерит то, что он вернул.
// Обработчики событий сокета живут здесь, вне React, и пишут прямо в кеш запросов.
const init = async (socket: Socket) => {
  const queryClient = new QueryClient();

  socket.on("newMessage", (message) => addMessage(queryClient, message));
  socket.on("newChannel", (channel) => addChannel(queryClient, channel));
  socket.on("renameChannel", (channel) => renameChannel(queryClient, channel));
  socket.on("removeChannel", (channel) => removeChannel(queryClient, channel));
  // За время обрыва связи события терялись — после переподключения данные перечитываются.
  socket.io.on("reconnect", () => queryClient.invalidateQueries());

  return <App queryClient={queryClient} />;
};

export default init;
