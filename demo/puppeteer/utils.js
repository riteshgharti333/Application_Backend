// utils.js

/**
 * Delay function to pause execution for a specified time.
 * @param {number} ms - Time in milliseconds to delay.
 * @returns {Promise}
 */
export function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Retry a function multiple times.
   * @param {Function} func - The function to retry.
   * @param {number} retries - Number of retries before failing.
   * @param {number} delayTime - Time to wait between retries.
   * @returns {Promise}
   */
  export async function retry(func, retries = 3, delayTime = 2000) {
    let lastError;
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        return await func();
      } catch (error) {
        lastError = error;
        if (attempt < retries - 1) {
          await delay(delayTime);
        }
      }
    }
    throw lastError;
  }
  