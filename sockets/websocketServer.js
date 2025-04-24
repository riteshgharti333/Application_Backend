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
    const symbols = parsedUrl.searchParams.getAll("symbol");
    client.symbols = new Set();
    addClient(client);

    console.log("🔌 WebSocket Client Connected");

    if (symbols.length > 0) {
      console.log("📦 Subscribing to:", symbols);
      symbols.forEach((sym) => subscribeClient(client, sym));
    }

    client.on("message", (msg) => {
      try {
        const { type, symbol, symbols } = JSON.parse(msg);
        if (type === "subscribe") {
          if (symbol) subscribeClient(client, symbol);
          if (Array.isArray(symbols)) {
            symbols.forEach((sym) => subscribeClient(client, sym));
          }
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
