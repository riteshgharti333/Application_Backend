// utils/getValidAccessToken.js
import Client from "../models/Client.js";

export const getValidAccessToken = async () => {
  try {
    const client = await Client.findOne();

    if (!client) {
      console.error("❌ No client found in the database. Upstox login might be required.");
      return null;
    }

    if (!client.upstoxAccessToken) {
      console.error("❌ Client found but 'upstoxAccessToken' is missing.");
      return null;
    }

    return client.upstoxAccessToken;
  } catch (err) {
    console.error("❌ Error while fetching access token:", err.message);
    return null;
  }
};
