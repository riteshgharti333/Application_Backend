// sockets/stockBroadcaster.js
import Stock from "../models/stockModel.js";
import { broadcast } from "./clientManager.js";

export const broadcastLatestStockData = async () => {
  try {
    const stocks = await Stock.find({}, "symbol ltp ltt ltq cp").lean();
    broadcast({ type: "live_stock_update", data: stocks });
  } catch (err) {
    console.error("❌ Failed to fetch or broadcast stock data:", err);
  }
};
