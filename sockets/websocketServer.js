// /sockets/websocketServer.js
import { WebSocketServer } from "ws";
import { URL } from "url";
import {
  addClient,
  removeClient,
  subscribeClient,
} from "../utils/clientManager.js";

let wss;

export function setupWebSocket(server = null) {
  wss = server
    ? new WebSocketServer({ server }) // Render
    : new WebSocketServer({ port: 8081 }); // Local

  wss.on("connection", (client, req) => {
    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    const token = parsedUrl.searchParams.get("token");
    const symbol = parsedUrl.searchParams.get("symbol");

    console.log("🔌 WebSocket Client Connected");
    console.log("🔐 Token:", token);
    console.log("📦 Symbol:", symbol);

    addClient(client);

    if (symbol) subscribeClient(client, symbol);

    client.on("message", (msg) => {
      try {
        const { type, symbol } = JSON.parse(msg);
        if (type === "subscribe" && symbol) {
          subscribeClient(client, symbol);
        }
      } catch (err) {
        console.error("💥 Error parsing message:", err);
      }
    });

    client.on("close", () => {
      removeClient(client);
    });
  });

  console.log(
    `🧠 WebSocket Server ${
      server ? "attached to Express (Render)" : "running on ws://localhost:8081"
    }`
  );
}

export { wss };
