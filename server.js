// server.js
import { app } from "./app.js";
import { connectDB } from "./data/database.js";
import { createServer } from "http";
import { setupWebSocket } from "./sockets/websocketServer.js";
import { startUpstoxFeed } from "./services/upstoxFeed.js";
import { Auth } from "./models/authModel.js";

const PORT = process.env.PORT || 8080;

(async () => {
  try {
    // 1. Connect to DB
    await connectDB();
    console.log("✅ MongoDB connected");

    // 2. Create HTTP server from Express app
    const server = createServer(app);

    // 3. Start WebSocket server
    setupWebSocket(server); // For Render/Local

    // 4. Start HTTP server
    server.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });

    // 5. Optional buffer to ensure DB is ready
    console.log("⏳ Waiting 3 seconds before querying for access token...");
    await new Promise((resolve) => setTimeout(resolve, 20000));

    // 6. Start Upstox Feed if token exists
    const user = await Auth.findOne({ upstoxAccessToken: { $exists: true } });
    if (!user) {
      console.error("❌ No user with access token found");
      process.exit(1);
    }

    startUpstoxFeed(user.upstoxAccessToken);
  } catch (err) {
    console.error("❌ Startup error:", err);
    process.exit(1);
  }
})();
