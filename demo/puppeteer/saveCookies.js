// saveCookies.js

import fs from 'fs';
import path from 'path';

/**
 * Save cookies to a JSON file.
 * @param {Array} cookies - The cookies to save.
 */
export function saveCookies(cookies) {
  const filePath = path.join(process.cwd(), 'data', 'cookies.json');
  
  // Write the cookies to a JSON file
  fs.writeFileSync(filePath, JSON.stringify(cookies, null, 2));
  console.log('Cookies have been saved!');
}

export default saveCookies;
