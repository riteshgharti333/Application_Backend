// utils/upstoxSessionManager.js

import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const COOKIE_PATH = path.resolve('upstox-session.json');
const LOGIN_URL = 'https://login.upstox.com/';

export const getUpstoxSession = async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  // Load existing cookies if available
  try {
    const cookiesString = await fs.readFile(COOKIE_PATH, 'utf8');
    const cookies = JSON.parse(cookiesString);
    await page.setCookie(...cookies);
    console.log('✅ Loaded existing session cookies');
  } catch (err) {
    console.log('❌ No saved cookies found, continuing without session');
  }

  // Go to Upstox login page
  await page.goto(LOGIN_URL, { waitUntil: 'networkidle2' });

  // Check if already logged in
  if (page.url().includes('dashboard')) {
    console.log('✅ Session valid, already logged in');
  } else {
    console.log('🔐 Need to login manually (one-time setup)');

    // Type login credentials
    await page.type('input[name=username]', process.env.UPSTOX_USERNAME);
    await page.type('input[name=password]', process.env.UPSTOX_PASSWORD);
    await Promise.all([
      page.click('button[type=submit]'),
      page.waitForNavigation({ waitUntil: 'networkidle2' })
    ]);

    // Wait for user to manually enter OTP
    console.log('📲 Enter OTP manually if prompted...');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
  }

  // Save new cookies
  const cookies = await page.cookies();
  await fs.writeFile(COOKIE_PATH, JSON.stringify(cookies, null, 2));
  console.log('✅ Session cookies saved for future reuse');

  await browser.close();
};