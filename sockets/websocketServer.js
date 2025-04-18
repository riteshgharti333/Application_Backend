import { WebSocketServer } from "ws";
import url from "url";
import Stock from "../models/smModel.js";

const clients = new Map(); // Map<ws, Set<symbol>>

export const setupWebSocket = (serverOrPort = 8081) => {
  const isPort = typeof serverOrPort === "number";

  const wss = isPort
    ? new WebSocketServer({ port: serverOrPort })         // local: port 8081
    : new WebSocketServer({ server: serverOrPort });      // deploy: attach to Express

  wss.on("connection", async (ws, req) => {
    const parsedUrl = url.parse(req.url, true);
    const rawSymbols = parsedUrl.query.symbol;

    const symbolArray = Array.isArray(rawSymbols) ? rawSymbols : [rawSymbols];
    const subscribedSymbols = new Set(symbolArray.filter(Boolean));

    clients.set(ws, subscribedSymbols);
    console.log("🔗 Client connected for symbols:", [...subscribedSymbols]);

    try {
      const initialData = await Stock.find(
        { symbol: { $in: [...subscribedSymbols] } },
        "symbol ltp ltt ltq cp"
      ).lean();
      ws.send(
        JSON.stringify({ type: "initial_stock_data", data: initialData })
      );
    } catch (err) {
      console.error("❌ Error sending initial data:", err);
    }

    ws.on("close", () => {
      clients.delete(ws);
      console.log("❌ Client disconnected");
    });
  });

  // Send data only to relevant clients
  const sendLiveUpdate = (payload) => {
    for (const [ws, subscribedSymbols] of clients.entries()) {
      if (ws.readyState === ws.OPEN) {
        const filtered = payload.filter((item) =>
          subscribedSymbols.has(item.symbol)
        );
        if (filtered.length > 0) {
          ws.send(
            JSON.stringify({ type: "live_stock_update", data: filtered })
          );
        }
      }
    }
  };

  // Global broadcaster
  global.liveStockBroadcaster = sendLiveUpdate;

  const mode = isPort ? `ws://localhost:${serverOrPort}` : `Attached to HTTP server`;
  console.log(`🚀 WebSocket server started on ${mode}`);
};
