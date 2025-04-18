import { app } from "./app.js";
import { connectDB } from "./data/database.js";
import { startUpstoxFeed } from "./services/upstoxFeed.js";
import { Auth } from "./models/authModel.js";
import { setupWebSocket } from "./sockets/websocketServer.js";

import { createServer } from "http";

const PORT = process.env.PORT || 3000;
const RENDER = process.env.RENDER === "true";

// Connect DB
await connectDB();

// Create HTTP server (shared between Express + WebSocket)
const server = createServer(app);

server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

// Start Upstox feed
const user = await Auth.findOne({ upstoxAccessToken: { $exists: true } });
if (!user) {
  console.error("❌ No user with access token found");
  process.exit(1);
}
startUpstoxFeed(user.upstoxAccessToken);

// Setup WebSocket
if (RENDER) {
  // ✅ On Render: attach WebSocket to same server (no custom port)
  setupWebSocket(server);
} else {
  // ✅ Locally: use custom WebSocket port
  setupWebSocket(8081);
}
