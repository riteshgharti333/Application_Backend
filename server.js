import http from "http";
import { app } from "./app.js";
import { connectDB } from "./data/database.js";
import { startUpstoxFeed } from "./services/upstoxFeed.js";
import { Auth } from "./models/authModel.js";
import { setupWebSocket } from "./sockets/websocketServer.js";

const PORT = process.env.PORT || 3000;

// Connect to DB
await connectDB();

// Get user with Upstox token
const user = await Auth.findOne({ upstoxAccessToken: { $exists: true } });
if (!user) {
  console.error("❌ No user with access token found");
  process.exit(1);
}
startUpstoxFeed(user.upstoxAccessToken);

// Detect if running on Render or local
const isRender = process.env.RENDER === "true"; // optional flag for Render

if (isRender) {
  // Use same server for HTTP and WebSocket (Render allows only one port)
  const server = http.createServer(app);
  setupWebSocket(server); // pass HTTP server to WebSocket
  server.listen(PORT, () => {
    console.log(`🚀 Server running (Render): http://localhost:${PORT}`);
  });
} else {
  // Local dev: Express on PORT, WebSocket on 8081
  app.listen(PORT, () => {
    console.log(`🚀 Server running (Local): http://localhost:${PORT}`);
  });
  setupWebSocket(8081); // run WebSocket separately
}
