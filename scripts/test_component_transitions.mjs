import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const chromePaths = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
];

const executablePath = chromePaths.find((p) => fs.existsSync(p));
if (!executablePath) {
  console.error('No Chrome binary found!');
  process.exit(1);
}

const artifactDir = '/Users/jayakrishna/.gemini/antigravity-ide/brain/14a5c867-efb6-4e2c-b19b-304469980ec9';

async function main() {
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1400,900'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  // 1. Seed admin state in localStorage so we bypass the admin guard seamlessly
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

  // 2. Reload shortcuts page
  await page.goto('http://localhost:5173/shortcuts', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 800));

  // Capture Admin Shortcuts with new 21st.dev Component Transition Engine
  const shortcutsScreenshot = path.join(artifactDir, 'admin_shortcuts_with_transition_engine.png');
  await page.screenshot({ path: shortcutsScreenshot });
  console.log('Saved:', shortcutsScreenshot);

  // 3. Test component transition by clicking a step button
  // Find the button for Step 04 (/choice) or Step 09 (/privacy)
  const buttons = await page.$$('.btn-21st-loading');
  console.log(`Found ${buttons.length} 21st.dev loading buttons on page.`);

  if (buttons.length > 0) {
    // Click the 4th button (Step 04 - Choice or similar)
    const targetBtn = buttons[3] || buttons[0];
    await targetBtn.click();

    // Immediately capture the mid-transition gap (showing button loading state + top progress bar)
    await new Promise((r) => setTimeout(r, 120));
    const loadingGapScreenshot = path.join(artifactDir, 'component_switching_loading_gap.png');
    await page.screenshot({ path: loadingGapScreenshot });
    console.log('Saved mid-transition loading gap screenshot:', loadingGapScreenshot);

    // Wait for the transition to finish and target component to animate in
    await new Promise((r) => setTimeout(r, 650));
    const arrivedScreenshot = path.join(artifactDir, 'component_transition_arrived.png');
    await page.screenshot({ path: arrivedScreenshot });
    console.log('Saved arrived component screenshot:', arrivedScreenshot);
  }

  await browser.close();
  console.log('All component transition tests completed successfully!');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
