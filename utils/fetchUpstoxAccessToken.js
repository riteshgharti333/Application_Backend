// utils/fetchUpstoxAccessToken.js
import fs from "fs/promises";
import path from "path";
import puppeteer from "puppeteer";
import fetch from "node-fetch";
import dotenv from "dotenv";
import Client from "../models/Client.js";

dotenv.config();

export const fetchAccessTokenUsingSession = async () => {
  const cookiesPath = path.resolve("cookies/upstox-session.json");

  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();

  // Load session cookies
  try {
    const cookies = JSON.parse(await fs.readFile(cookiesPath, "utf-8"));
    await page.setCookie(...cookies);
  } catch (err) {
    console.error("❌ Failed to load session cookies:", err);
    await browser.close();
    return null;
  }

  const authUrl = `https://api.upstox.com/v2/login/authorization/dialog?client_id=${process.env.UPSTOX_CLIENT_ID}&redirect_uri=${process.env.UPSTOX_REDIRECT_URI}&response_type=code`;

  try {
    await page.goto(authUrl, { waitUntil: "networkidle2" });

    // Wait for redirect URL (after login)
    await page.waitForNavigation({
      waitUntil: "networkidle2",
      timeout: 15000,
    });

    const currentUrl = page.url();
    const urlObj = new URL(currentUrl);
    const code = urlObj.searchParams.get("code");

    if (!code) throw new Error("Authorization code not found");

    // Exchange code for access token
    const tokenRes = await fetch("https://api.upstox.com/v2/login/authorization/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.UPSTOX_CLIENT_ID,
        client_secret: process.env.UPSTOX_CLIENT_SECRET,
        redirect_uri: process.env.UPSTOX_REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) throw new Error("Failed to get access token");

    // ✅ Save access token to MongoDB
    await Client.findOneAndUpdate(
      {}, // Assuming single client
      {
        upstoxAccessToken: tokenData.access_token,
        upstoxTokenFetchedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    console.log("✅ Access token saved to DB");

    await browser.close();
    return tokenData;
  } catch (err) {
    console.error("❌ Error during token fetch:", err);
    await browser.close();
    return null;
  }
};
