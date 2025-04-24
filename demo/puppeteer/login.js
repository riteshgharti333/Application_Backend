// login.js

import puppeteer from 'puppeteer-core';
import { jioConfig } from '../config/config.js';
import { delay, retry } from './utils.js';
import saveCookies from './saveCookies.js';

/**
 * Log in to Jio using mobile number and OTP.
 */
export async function loginToJio() {
  try {
    // Launch Puppeteer with system Chrome
    const browser = await puppeteer.launch({
      headless: jioConfig.headless,
      executablePath: jioConfig.chromePath, // Add this in your config
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.goto(jioConfig.loginUrl);

    // Enter mobile number
    await page.waitForSelector(jioConfig.mobileNumberFieldSelector, { timeout: 100000 });
    await page.type(jioConfig.mobileNumberFieldSelector, jioConfig.mobileNumber);

    // Submit mobile number
    await page.click('#submit-mobile');

    // Wait for OTP entry
    await page.waitForSelector(jioConfig.otpFieldSelector);
    console.log("Please enter OTP manually in the browser...");

    // Wait for submit button and click after OTP is entered
    await page.waitForSelector(jioConfig.submitOtpSelector);
    await page.click(jioConfig.submitOtpSelector);

    await page.waitForNavigation();
    console.log('Successfully logged in to Jio!');

    // Save cookies
    const cookies = await page.cookies();
    saveCookies(cookies);

    await browser.close();
  } catch (err) {
    console.error('Error during login:', err);
  }
}
