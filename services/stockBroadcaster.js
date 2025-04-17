// services/stockBroadcaster.js
import { getSubscribedClients } from "../utils/clientManager.js";

export const broadcastStockUpdate = (symbol, data) => {
  const payload = JSON.stringify({ symbol, ...data });
  const clients = getSubscribedClients(symbol);

  for (const client of clients) {
    client.send(payload);
    // Optional: log less frequently
    console.log(`📤 Sent update to client for ${symbol}`);
  }
};
