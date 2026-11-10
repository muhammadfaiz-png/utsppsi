const puppeteer = require('puppeteer-core');
const path = require('path');
const os = require('os');
const fs = require('fs');

const url = process.argv[2] || 'http://127.0.0.1:3000/command';
const outputPath = process.argv[3] || path.join(__dirname, '../public/screenshot.png');

(async () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pup-chrome-'));
  try {
    const browser = await puppeteer.launch({
      executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        `--user-data-dir=${tempDir}`,
        '--disable-gpu',
        '--disable-dev-shm-usage',
      ],
      defaultViewport: {
        width: 1440,
        height: 900,
        deviceScaleFactor: 1,
      },
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    // Allow brief time for fonts and CSS to render
    await new Promise((r) => setTimeout(r, 2000));
    await page.screenshot({ path: outputPath, fullPage: false });
    console.log(`Screenshot saved successfully to ${outputPath}`);
    await browser.close();
  } catch (err) {
    console.error('Failed to take screenshot:', err);
    process.exit(1);
  } finally {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (e) {}
  }
})();
