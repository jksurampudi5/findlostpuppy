import puppeteer from 'puppeteer-core';
import { resolve } from 'node:path';

const chromePath = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const ARTIFACTS_DIR = '/Users/jayakrishna/.gemini/antigravity-ide/brain/14a5c867-efb6-4e2c-b19b-304469980ec9';

async function testShortcuts() {
  console.log('Testing AdminShortcuts tabs and screens...');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  // Seed session as admin to access admin shortcuts
  await page.goto('http://localhost:5173/shortcuts', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    localStorage.setItem('findlostpuppy_active_user', JSON.stringify({
      id: 'admin-tester-uid',
      email: 'jksurampudi5@gmail.com',
      name: 'Jaya Krishna',
      isAdmin: true
    }));
    localStorage.setItem('findlostpuppy_consent_agreed_v1', 'true');
    localStorage.setItem('findlostpuppy_launch_seen', 'true');
    localStorage.setItem('findlostpuppy_gratitude_seen', 'true');
    sessionStorage.setItem('findlostpuppy_launch_seen', 'true');
    sessionStorage.setItem('findlostpuppy_gratitude_seen', 'true');
  });

  await page.goto('http://localhost:5173/shortcuts', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: `${ARTIFACTS_DIR}/admin_shortcuts_tab_flow.png`, fullPage: false });
  console.log('✅ Flow tab screenshot captured');

  // Click on Documents tab
  const buttons = await page.$$('button');
  for (const btn of buttons) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text && text.includes('Official Documents & PDFs')) {
      await btn.click();
      break;
    }
  }
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: `${ARTIFACTS_DIR}/admin_shortcuts_tab_docs.png`, fullPage: false });
  console.log('✅ Documents tab screenshot captured');

  // Click on Skills tab
  for (const btn of buttons) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text && text.includes('Skills & Extensions Used')) {
      await btn.click();
      break;
    }
  }
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: `${ARTIFACTS_DIR}/admin_shortcuts_tab_skills.png`, fullPage: false });
  console.log('✅ Skills tab screenshot captured');

  // Click on Security tab
  for (const btn of buttons) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text && text.includes('Security & Privacy Matrix')) {
      await btn.click();
      break;
    }
  }
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: `${ARTIFACTS_DIR}/admin_shortcuts_tab_security.png`, fullPage: false });
  console.log('✅ Security tab screenshot captured');

  await browser.close();
  console.log('All AdminShortcuts verification screenshots captured successfully!');
}

testShortcuts().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
