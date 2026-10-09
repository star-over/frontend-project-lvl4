import { createRoot } from "react-dom/client";
import { io } from "socket.io-client";

import init from "./init.tsx";

const root = createRoot(document.getElementById("chat")!);
root.render(await init(io()));
