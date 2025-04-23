// /upstox/puppeteer/loginAndSaveCookies.js
import puppeteer from "puppeteer";
import fs from "fs/promises";
import path from "path";



const COOKIES_PATH = path.resolve("./upstox/puppeteer/cookies.json");
const LOGIN_URL =
  "https://api.upstox.com/v2/login/authorization/dialog?response_type=code&client_id=215176f5-595f-421a-bf4e-875f14c5896a&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fapi%2Fauth%2Fupstox%2Fcallback&scope=profile+openid+offline_access&state=67fe1907d218f4539968633d";

const run = async () => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ["--start-maximized"],
  });

  const page = await browser.newPage();
  await page.goto(LOGIN_URL, { waitUntil: "networkidle2" });

  console.log("🔐 Please login manually and enter OTP if asked...");

  // Wait for navigation to callback, but intercept before actual redirect
  await page.setRequestInterception(true);

  page.on("request", async (req) => {
    const url = req.url();
    if (url.startsWith("http://localhost:3000/api/auth/upstox/callback")) {
      console.log("📦 Intercepted redirect to callback");

      // Grab cookies BEFORE letting the redirect happen
      const cookies = await page.cookies();
      await fs.writeFile(COOKIES_PATH, JSON.stringify(cookies, null, 2));
      console.log(`✅ Saved ${cookies.length} cookies to cookies.json`);

      // After saving, let the request continue
      await page.setRequestInterception(false);
      req.continue();

      // Optional: close after delay
      setTimeout(() => browser.close(), 2000);
    } else {
      req.continue();
    }
  });

  // Allow up to 2 min for manual login + OTP
  await page.waitForTimeout(2 * 60 * 1000);
};

run().catch((err) => {
  console.error("❌ Error during login:", err);
});
