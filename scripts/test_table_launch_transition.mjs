import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const chromePaths = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
];

const executablePath = chromePaths.find((p) => fs.existsSync(p));
const artifactDir = '/Users/jayakrishna/.gemini/antigravity-ide/brain/14a5c867-efb6-4e2c-b19b-304469980ec9';

async function main() {
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1400,900'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  // 1. Seed full session so user can access dashboard directly
  await page.goto('http://localhost:5173/shortcuts', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    const adminUser = {
      id: 'admin_test_14',
      email: 'jayakrishna.jk14@gmail.com',
      name: 'Jayakrishna',
      isAdmin: true,
    };
    localStorage.setItem('findlostpuppy_active_user', JSON.stringify(adminUser));
    localStorage.setItem('findlostpuppy_current_user_v1', JSON.stringify(adminUser));
    localStorage.setItem('findlostpuppy_consent_records_v1', JSON.stringify({
      hasAgreed: true,
      agreedAt: new Date().toISOString(),
      forms: ['terms', 'privacy', 'disclaimer', 'guidelines'],
    }));
  });

  await page.goto('http://localhost:5173/shortcuts', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 600));

  // Find all Launch buttons in table
  const launchButtons = await page.$$('table .btn-21st-loading');
  console.log(`Found ${launchButtons.length} table launch buttons.`);

  if (launchButtons.length >= 6) {
    // Click step 6 (Dashboard)
    await launchButtons[5].click();

    // Capture mid-transition gap
    await new Promise((r) => setTimeout(r, 150));
    await page.screenshot({ path: path.join(artifactDir, 'launch_dashboard_loading_gap.png') });

    // Wait for transition completion
    await new Promise((r) => setTimeout(r, 700));
    await page.screenshot({ path: path.join(artifactDir, 'launch_dashboard_arrived.png') });
  }

  await browser.close();
  console.log('Launch test completed!');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
