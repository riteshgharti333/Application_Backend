// utils/ensureValidUpstoxToken.js
import { refreshUpstoxToken } from "./upstoxTokenManager.js";
import { getUpstoxUserProfile } from "../services/getProfile.js";

/**
 * Ensure Upstox access token is valid. Refresh if expired.
 * @param {Object} user - MongoDB user document
 * @returns {Promise<string>} - Valid access token
 */
export const ensureValidUpstoxToken = async (user) => {
  let token = user.upstoxAccessToken;

  try {
    // Try to verify the current access token by calling a safe API
    await getUpstoxUserProfile(token);
    console.log("✅ Access token is valid");
  } catch (err) {
    console.log("🔄 Access token expired or invalid. Refreshing...");
    token = await refreshUpstoxToken(user);
    console.log("✅ Token refreshed successfully");
  }

  return token;
};
