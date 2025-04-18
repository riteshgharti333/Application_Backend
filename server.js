import http from "http";
import { app } from "./app.js";
import { connectDB } from "./data/database.js";
import { startUpstoxFeed } from "./services/upstoxFeed.js";
import { Auth } from "./models/authModel.js";
import { setupWebSocket } from "./sockets/websocketServer.js";
import dotenv from "dotenv";
dotenv.config();

const PORT = process.env.PORT || 3000;

// Connect to DB
await connectDB();

// Start Express HTTP server
const server = http.createServer(app);
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

// Start Upstox Feed
const user = await Auth.findOne({ upstoxAccessToken: { $exists: true } });
if (!user) {
  console.error("❌ No user with access token found");
  process.exit(1);
}
startUpstoxFeed(user.upstoxAccessToken);

// Decide WebSocket behavior
const isRender = process.env.IS_RENDER === "true";

// ✅ If deployed (Render): WebSocket on same HTTP server
// ✅ If local: Use separate port 8081
if (isRender) {
  setupWebSocket(server); // Use same server in Render
} else {
  setupWebSocket(8081); // Run separate port locally
}
