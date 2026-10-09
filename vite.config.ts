import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5002,
    proxy: {
      "/api": {
        target: "http://localhost:5001",
      },
      "/socket.io": {
        target: "ws://localhost:5001",
        ws: true,
        rewriteWsOrigin: true,
      },
    },
  },
});
