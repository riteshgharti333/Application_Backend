import UpstoxClient from "upstox-js-sdk";
import { WebSocket as WS } from "ws";
import protobuf from "protobufjs";
import smStock from "../models/smModel.js";
import { chunks } from "../utils/instruments.js";

import { broadcastStockUpdate } from "./stockBroadcaster.js";

let protobufRoot = null;

const initProtobuf = async () => {
  try {
    protobufRoot = await protobuf.load("MarketDataFeed.proto");
    console.log("✅ Protobuf initialized");
  } catch (err) {
    console.error("❌ Failed to initialize Protobuf:", err);
    throw err;
  }
};

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

      const subscriptionMsg = {
        guid: "sub-reliance",
        method: "sub",
        data: {
          mode: "full",
          instrumentKeys: ["NSE_EQ|INE002A01018"], // Reliance Industries Limited
        },
      };

      // chunks.forEach((chunk, index) => {
      //   const subscriptionMsg = {
      //     guid: `sub-${index}`,
      //     method: "sub",
      //     data: {
      //       mode: "full",
      //       instrumentKeys: chunk,
      //     },
      //   };
      socket.send(Buffer.from(JSON.stringify(subscriptionMsg)));
      // console.log(`📡 Subscribed to chunk ${index + 1} with ${chunk.length} instruments`);
      // });
    });

    socket.on("message", async (data) => {
      const decoded = decodeProtobuf(data);
      const feeds = decoded?.feeds;
      if (!feeds) return;

      for (const [symbol, entry] of Object.entries(feeds)) {
        const marketFF = entry?.ff?.marketFF;
        if (!marketFF) continue;

        const ltpc = marketFF?.ltpc;
        const { ltp, ltt, ltq, cp } = ltpc || {};

        // ✅ Store to DB
        await smStock.findOneAndUpdate(
          { symbol },
          {
            marketData: marketFF,
            ltp,
            ltt: ltt ? new Date(ltt) : undefined,
            ltq,
            cp,
          },
          { upsert: true, new: true }
        );

        // ✅ Broadcast using helper (cleaner + scalable)
        broadcastStockUpdate(symbol, { ltp, ltt, ltq, cp });
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
