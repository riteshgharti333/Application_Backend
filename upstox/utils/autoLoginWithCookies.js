// upstox/utils/autoLoginWithCookies.js
import puppeteer from "puppeteer";
import fs from "fs/promises";
import path from "path";
import { URL } from "url";
import fetch from "node-fetch";
import { config } from "dotenv";

config({ path: "./data/config.env" });

const UPSTOX_CLIENT_ID = process.env.UPSTOX_CLIENT_ID;
const UPSTOX_REDIRECT_URI = process.env.UPSTOX_REDIRECT_URI;
const UPSTOX_CLIENT_SECRET = process.env.UPSTOX_API_SECRET;

const LOGIN_URL = `https://api.upstox.com/v2/login/authorization/dialog?response_type=code&client_id=${UPSTOX_CLIENT_ID}&redirect_uri=${encodeURIComponent(UPSTOX_REDIRECT_URI)}&scope=profile+openid+offline_access&state=static-app-state`;

const cookiesPath = path.resolve("upstox/puppeteer/cookies.json");

const autoLoginWithCookies = async () => {
  let browser;
  try {
    console.log("🔄 Launching browser...");
    browser = await puppeteer.launch({
      headless: false,        // For debugging; set to true for prod
      slowMo: 50,             // Slows down actions for visual debugging
      defaultViewport: null,  // Uses full screen
    });

    const page = await browser.newPage();

    console.log("🔐 Loading cookies...");
    const cookiesString = await fs.readFile(cookiesPath);
    const cookies = JSON.parse(cookiesString);
    await page.setCookie(...cookies);

    console.log("🌐 Navigating to Upstox login URL...");
    await page.goto(LOGIN_URL, { waitUntil: "networkidle2" });

    // 🕵️ Manually wait until redirected URL contains "code="

    console.log("⏳ Waiting for authorization redirect...");
    let redirectedUrl = null;
    
    for (let i = 0; i < 15; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // wait 1s
      const currentUrl = page.url();
      if (currentUrl.includes("code=")) {
        redirectedUrl = currentUrl;
        break;
      }
    }
    
    if (!redirectedUrl) {
      console.error("❌ Auth code not found. Possibly expired session or invalid cookies.");
      return;
    }

    console.log("✅ Redirected URL:", redirectedUrl);

    const parsedUrl = new URL(redirectedUrl);
    const authCode = parsedUrl.searchParams.get("code");

    if (!authCode) {
      console.error("❌ Auth code missing in URL.");
      return;
    }

    console.log("🔑 Auth Code:", authCode);

    console.log("🔁 Exchanging code for tokens...");
    const tokenResponse = await fetch("https://api.upstox.com/v2/login/authorization/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: authCode,
        client_id: UPSTOX_CLIENT_ID,
        client_secret: UPSTOX_CLIENT_SECRET,
        redirect_uri: UPSTOX_REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      console.error("❌ Token exchange failed:", tokenData);
    } else {
      console.log("✅ Access Token:", tokenData.access_token);
      console.log("🔁 Refresh Token (Extended):", tokenData.refresh_token);

      // TODO: Save these tokens to DB or config file as needed
    }

  } catch (error) {
    console.error("🔥 Unexpected error during auto login:", error);
  } finally {
    if (browser) await browser.close();
  }
};

autoLoginWithCookies();
