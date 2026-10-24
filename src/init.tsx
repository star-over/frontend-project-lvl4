import { notifications } from "@mantine/notifications";
import type { Socket } from "socket.io-client";

import { addChannel, addMessage, createQueryClient, removeChannel, renameChannel } from "./api.ts";
import { App } from "./components/App.tsx";
import { i18n } from "./i18n.ts";

// Сокет приходит параметром, открывает его точка входа: проверка проекта
// зовёт init со своим сокетом и рендерит то, что он вернул.
// Обработчики событий сокета живут здесь, вне React, и пишут прямо в кеш запросов.
const init = async (socket: Socket) => {
  const queryClient = createQueryClient();

  socket.on("newMessage", (message) => addMessage(queryClient, message));
  socket.on("newChannel", (channel) => addChannel(queryClient, channel));
  socket.on("renameChannel", (channel) => renameChannel(queryClient, channel));
  socket.on("removeChannel", (channel) => removeChannel(queryClient, channel));

  // Связь пропала — уведомление висит, пока сокет не переподключится.
  // Закрытие сокета самим клиентом (выход, конец тестов) — не обрыв сети.
  socket.on("disconnect", (reason) => {
    if (reason === "io client disconnect") return;
    notifications.show({
      id: "offline",
      color: "red",
      autoClose: false,
      message: i18n.t("errors.offline"),
    });
  });
  socket.on("connect", () => notifications.hide("offline"));
  // За время обрыва связи события терялись — после переподключения данные перечитываются.
  socket.io.on("reconnect", () => queryClient.invalidateQueries());

  return <App queryClient={queryClient} />;
};

export default init;
