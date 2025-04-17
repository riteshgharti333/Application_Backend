// // /util/stockData.js
// import { WebSocketServer } from "ws";

// export const wss = new WebSocketServer({ port: 8081 });
// export const clientSubscriptions = new Map(); // Map<client, [symbols]>

// wss.on("connection", (ws) => {
//   console.log("✅ WebSocket client connected");

//   // Store which stock(s) this client want
//   clientSubscriptions.set(ws, []);

//   ws.on("message", (message) => {
//     const data = JSON.parse(message.toString());

//     if (data.type === "subscribe") {
//       const current = clientSubscriptions.get(ws) || [];
//       clientSubscriptions.set(ws, [...new Set([...current, data.symbol])]);
//       console.log(`📝 Subscribed ${data.symbol} for this client`);
//     }
//   });

//   ws.on("close", () => {
//     console.log("❌ Client disconnected");
//     clientSubscriptions.delete(ws);
//   });
// });
