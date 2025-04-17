// server.js
import { app } from "./app.js";
import { connectDB } from "./data/database.js";
import { createServer } from "http";
import { setupWebSocket } from "./sockets/websocketServer.js";
import { startUpstoxFeed } from "./services/upstoxFeed.js";
import { Auth } from "./models/authModel.js";

const PORT = process.env.PORT || 8080;

// 1. Connect to DB
await connectDB();

// 2. Create HTTP server from Express app (needed for Render WS support)
const server = createServer(app);

// 3. Start WebSocket server
setupWebSocket(server); // <-- attaches to `server` for Render

// 4. Start HTTP server
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

// 5. Start Upstox Feed if token exists
const user = await Auth.findOne({ upstoxAccessToken: { $exists: true } });
if (!user) {
  console.error("❌ No user with access token found");
  process.exit(1);
}
startUpstoxFeed(user.upstoxAccessToken);
