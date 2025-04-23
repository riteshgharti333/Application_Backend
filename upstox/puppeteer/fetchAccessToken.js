// /upstox/puppeteer/fetchAccessToken.js
import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';
import dotenv, { config } from 'dotenv';
import fetch from 'node-fetch';

config({ path: "./data/config.env" });

const COOKIE_PATH = path.resolve('./upstox/puppeteer/cookies.json');

const {
  UPSTOX_CLIENT_ID,
  UPSTOX_REDIRECT_URI,
  UPSTOX_CLIENT_SECRET,
} = process.env;

async function fetchNewAccessToken() {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  // Load cookies
  const cookies = JSON.parse(await fs.readFile(COOKIE_PATH, 'utf8'));
  await page.setCookie(...cookies);

  // Build OAuth URL
  const authUrl = `https://api.upstox.com/v2/login/authorization/dialog?client_id=${UPSTOX_CLIENT_ID}&redirect_uri=${encodeURIComponent(
    UPSTOX_REDIRECT_URI
  )}&response_type=code`;

  console.log('[*] Launching browser...');
console.log('[*] Opening page...');
console.log('[*] Goto:', authUrl);
await page.goto(authUrl, { waitUntil: 'load', timeout: 60000 });
console.log('[*] Page loaded');

  // Wait for redirect to your REDIRECT_URI
  await page.waitForNavigation({ waitUntil: 'networkidle0' });

  const redirectedUrl = page.url();
  const urlObj = new URL(redirectedUrl);
  const authCode = urlObj.searchParams.get('code');

  if (!authCode) {
    console.error('[!] Authorization code not found in redirect URL');
    await browser.close();
    return;
  }

  console.log('[+] Authorization Code:', authCode);

  // Exchange code for access token
  const tokenResponse = await fetch('https://api.upstox.com/v2/login/authorization/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      code: authCode,
      client_id: UPSTOX_CLIENT_ID,
      client_secret: UPSTOX_CLIENT_SECRET,
      redirect_uri: UPSTOX_REDIRECT_URI,
      grant_type: 'authorization_code',
    }),
  });

  const tokenData = await tokenResponse.json();

  if (!tokenData.access_token) {
    console.error('[!] Failed to get access token:', tokenData);
  } else {
    console.log('[+] Fetched new access token ✅');
    console.log(tokenData);

    // You can store tokenData.access_token and tokenData.refresh_token here
    // Example: await User.updateOne({ ... }, { upstoxAccessToken: tokenData.access_token })

    // OR: Save to local file for testing
    await fs.writeFile('./upstox/puppeteer/latestAccessToken.json', JSON.stringify(tokenData, null, 2));
  }

  await browser.close();
}

fetchNewAccessToken().catch(console.error);
