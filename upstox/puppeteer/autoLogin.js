// puppeteer/autoLogin.js
import puppeteer from "puppeteer";
import fs from "fs/promises";
import path from "path";

const COOKIES_PATH = path.resolve("puppeteer/cookies.json");

export const performAutoLogin = async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage();

  // Load saved cookies
  const cookies = JSON.parse(await fs.readFile(COOKIES_PATH, "utf8"));
  await page.setCookie(...cookies);

  // Go to the Upstox home page
  await page.goto("https://upstox.com", { waitUntil: "networkidle2" });

  // Wait for potential redirection & fetch new access token
  await page.waitForTimeout(3000);

  // Navigate to Upstox OAuth redirect page (to trigger token refresh)
  const oauthURL = `https://api.upstox.com/v2/login/authorization/dialog?response_type=code&client_id=YOUR_CLIENT_ID&redirect_uri=YOUR_CALLBACK_URL&scope=read%20write`;

  await page.goto(oauthURL, { waitUntil: "networkidle2" });

  // Wait until the redirect happens
  await page.waitForNavigation({ waitUntil: "networkidle2" });

  const redirectedUrl = page.url();
  console.log("Redirected URL:", redirectedUrl);

  // You can now extract the code parameter from the URL
  const urlObj = new URL(redirectedUrl);
  const authCode = urlObj.searchParams.get("code");

  if (authCode) {
    console.log("Authorization Code:", authCode);

    // Make a server call to exchange this code for access token
    // E.g., send it to your `/api/upstox/callback?code=${authCode}`
  } else {
    console.error("Authorization code not found");
  }

  await browser.close();
};
