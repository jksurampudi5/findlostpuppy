import puppeteer from 'puppeteer-core';
import { mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const SCREENSHOT_DIR = '/Users/jayakrishna/.gemini/antigravity-ide/brain/cab227a9-7293-4978-80ff-e8b95086102c/automotive_theme_screenshots';
if (!existsSync(SCREENSHOT_DIR)) {
  mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function verifyScreenshots() {
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--no-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true });

  const context = browser.defaultBrowserContext();
  await context.overridePermissions('http://localhost:5173', ['geolocation']);
  await page.setGeolocation({ latitude: 17.4852, longitude: 78.3421, accuracy: 14.5 });

  // Initial load to setup localStorage
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });
  await page.evaluate(() => {
    localStorage.setItem('findlostpuppy_consent_v1', JSON.stringify({
      consentVersion: '1.0',
      termsVersion: '1.0',
      privacyVersion: '1.0',
      disclaimerVersion: '1.0',
      guidelinesVersion: '1.0',
      agreedAt: new Date().toISOString(),
      appVersion: '0.1.0',
      acceptedForms: { terms: true, privacy: true, disclaimer: true, guidelines: true, declaration: true },
      consentMethod: 'master_declaration'
    }));
    localStorage.setItem('findlostpuppy_active_user', JSON.stringify({
      id: 'user-demo-123',
      email: 'jksurampudi5@gmail.com',
      name: 'Jaya Krishna',
      phone: '8688884848',
      isAdmin: true,
      createdAt: new Date().toISOString()
    }));
  });

  const pagesToTest = [
    { name: '1_dashboard_missing', url: 'http://localhost:5173/dashboard' },
    { name: '2_dashboard_safe', url: 'http://localhost:5173/dashboard?tab=safe' },
    { name: '3_owner_profile', url: 'http://localhost:5173/owner' },
    { name: '4_location_onboarding', url: 'http://localhost:5173/location' },
    { name: '5_pet_profile', url: 'http://localhost:5173/pet' },
    { name: '6_community_discovery', url: 'http://localhost:5173/find' }
  ];

  for (const item of pagesToTest) {
    console.log(`Navigating to ${item.name} (${item.url})...`);
    await page.goto(item.url, { waitUntil: 'networkidle2' });
    await page.addStyleTag({
      content: '.launch-overlay-backdrop { display: none !important; }'
    });
    await new Promise(r => setTimeout(r, 800));

    const filePath = join(SCREENSHOT_DIR, `${item.name}.png`);
    await page.screenshot({ path: filePath, fullPage: false });
    console.log(`Saved screenshot: ${filePath}`);
  }

  await browser.close();
  console.log('All screens captured successfully!');
}

verifyScreenshots().catch(err => {
  console.error('Error verifying screenshots:', err);
  process.exit(1);
});
