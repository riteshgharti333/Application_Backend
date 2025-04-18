import UpstoxClient from "upstox-js-sdk";
import { WebSocket as WS } from "ws";
import protobuf from "protobufjs";
import Stock from "../models/stockModel.js";
import { chunks } from "../utils/instruments.js";
import { broadcast } from "../sockets/clientManager.js";

let protobufRoot = null;

// Load Protobuf schema
const initProtobuf = async () => {
  try {
    protobufRoot = await protobuf.load("MarketDataFeed.proto");
    console.log("✅ Protobuf initialized");
  } catch (err) {
    console.error("❌ Failed to initialize Protobuf:", err);
    throw err;
  }
};

// Decode Protobuf message
const decodeProtobuf = (buffer) => {
  if (!protobufRoot) {
    console.warn("⚠️ Protobuf not initialized");
    return null;
  }
  try {
    const FeedResponse = protobufRoot.lookupType(
      "com.upstox.marketdatafeeder.rpc.proto.FeedResponse"
    );
    return FeedResponse.decode(buffer);
  } catch (err) {
    console.error("❌ Error decoding Protobuf:", err);
    return null;
  }
};

// Convert Long Timestamp to JS Date
const convertLttToDate = (ltt) => {
  try {
    if (!ltt || typeof ltt.toNumber !== "function") return null;
    const nanos = ltt.high * Math.pow(2, 32) + (ltt.low >>> 0);
    const millis = nanos / 1_000_000;
    return new Date(millis);
  } catch (err) {
    console.warn("⚠️ Failed to convert ltt to Date:", err);
    return null;
  }
};

export const startUpstoxFeed = async (accessToken) => {
  try {
    const defaultClient = UpstoxClient.ApiClient.instance;
    defaultClient.authentications["OAUTH2"].accessToken = accessToken;

    const apiVersion = "2.0";
    const wsApi = new UpstoxClient.WebsocketApi();

    const response = await new Promise((resolve, reject) => {
      wsApi.getMarketDataFeedAuthorize(apiVersion, (error, data) => {
        if (error) return reject(error);
        resolve(data);
      });
    });

    const wsUrl = response.data.authorizedRedirectUri;
    await initProtobuf();

    const socket = new WS(wsUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Api-Version": apiVersion,
      },
    });

    socket.on("open", () => {
      console.log("🔌 WebSocket connected");

      chunks.forEach((chunk, index) => {
        const subscriptionMsg = {
          guid: `sub-${index}`,
          method: "sub",
          datæa: {
            mode: "full",
            instrumentKeys: chunk,
          },
        };
        socket.send(Buffer.from(JSON.stringify(subscriptionMsg)));
        console.log(`📡 Subscribed to chunk ${index + 1}`);
      });
    });

    socket.on("message", async (data) => {
      const decoded = decodeProtobuf(data);
      const feeds = decoded?.feeds;
      if (!feeds) return;

      const updates = [];

      for (const [symbol, entry] of Object.entries(feeds)) {
        const marketFF = entry?.ff?.marketFF;
        if (!marketFF) continue;

        const ltpc = marketFF?.ltpc;
        const { ltp, ltt, ltq, cp } = ltpc || {};

        console.log("📦 Incoming:", symbol, {
          ltp,
          ltt: ltt?.toString?.(),
          ltq: ltq?.toString?.(),
          cp,
        });

        // Loosen the check: allow 0 ltp, just ensure not undefined
        if (ltp === undefined || ltt === undefined) {
          console.log("⚠️ Skipping - Missing ltp or ltt:", symbol);
          continue;
        }

        const lttParsed = convertLttToDate(ltt);
        const ltqParsed = ltq?.toNumber ? ltq.toNumber() : ltq;

        try {
          const updatedDoc = await Stock.findOneAndUpdate(
            { symbol },
            {
              marketData: marketFF,
              ltp,
              ltq: ltqParsed,
              cp,
              ltt: lttParsed,
            },
            { upsert: true, new: true }
          );

          console.log("✅ Updated DB:", updatedDoc.symbol, updatedDoc.ltp);

          updates.push({
            symbol,
            ltp,
            ltq: ltqParsed,
            cp,
            ltt: lttParsed,
          });
        } catch (err) {
          console.error("❌ Error updating DB:", symbol, err);
        }
      }

      // ✅ Broadcast updated stock data
      if (updates.length > 0) {
        broadcast({
          type: "live_stock_update",
          data: updates,
        });
      }
    });

    socket.on("error", (err) => {
      console.error("💥 WebSocket error:", err);
    });

    socket.on("close", () => {
      console.log("❌ WebSocket closed");
    });
  } catch (err) {
    console.error("🔥 Error in startUpstoxFeed:", err);
  }
};
