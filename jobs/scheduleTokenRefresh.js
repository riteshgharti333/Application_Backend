// jobs/scheduleTokenRefresh.js
import cron from "node-cron";
import { fetchAccessTokenUsingSession } from "../utils/fetchUpstoxAccessToken.js";

// This will run every day at 8:00 AM (server time)
export const scheduleTokenRefresh = () => {
  cron.schedule("0 8 * * *", async () => {
    console.log("🕗 Running daily Upstox token refresh job...");
    const tokenData = await fetchAccessTokenUsingSession();

    if (tokenData?.access_token) {
      console.log("🔄 Token refreshed successfully");
      // Optional: Save token to DB here if not handled in utils
    } else {
      console.log("⚠️ Failed to refresh token");
    }
  });

  console.log("📅 Daily token refresh job scheduled (8:00 AM)");
};
