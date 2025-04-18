import { WebSocketServer } from "ws";
import url from "url";
import Stock from "../models/smModel.js";

const clients = new Map(); // Map<ws, Set<symbol>>

export const setupWebSocket = (serverPort = 8081) => {
  const wss = new WebSocketServer({ port: serverPort });

  wss.on("connection", async (ws, req) => {
    const parsedUrl = url.parse(req.url, true);
    const rawSymbols = parsedUrl.query.symbol;

    // Support: /symbol?symbol=s1&symbol=s2 or /symbol?symbol=s1
    const symbolArray = Array.isArray(rawSymbols) ? rawSymbols : [rawSymbols];
    const subscribedSymbols = new Set(symbolArray.filter(Boolean));

    clients.set(ws, subscribedSymbols);
    console.log("🔗 Client connected for symbols:", [...subscribedSymbols]);

    // Send initial DB data for these symbols
    try {
      const initialData = await Stock.find(
        { symbol: { $in: [...subscribedSymbols] } },
        "symbol ltp ltt ltq cp"
      ).lean();
      ws.send(JSON.stringify({ type: "initial_stock_data", data: initialData }));
    } catch (err) {
      console.error("❌ Error sending initial data:", err);
    }

    ws.on("close", () => {
      clients.delete(ws);
      console.log("❌ Client disconnected");
    });
  });

  // Broadcast only to relevant clients
  const sendLiveUpdate = (payload) => {
    for (const [ws, subscribedSymbols] of clients.entries()) {
      if (ws.readyState === ws.OPEN) {
        const filtered = payload.filter(item => subscribedSymbols.has(item.symbol));
        if (filtered.length > 0) {
          ws.send(JSON.stringify({ type: "live_stock_update", data: filtered }));
        }
      }
    }
  };

  // Make broadcaster globally callable
  global.liveStockBroadcaster = sendLiveUpdate;

  console.log(`🚀 WebSocket server started on ws://localhost:${serverPort}`);
};
