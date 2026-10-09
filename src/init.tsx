import type { Socket } from "socket.io-client";

import { App } from "./components/App.tsx";

// Сокет приходит параметром, открывает его точка входа: проверка проекта
// зовёт init со своим сокетом и рендерит то, что он вернул.
const init = async (_socket: Socket) => <App />;

export default init;
