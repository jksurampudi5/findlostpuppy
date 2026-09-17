import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const artifactDir = '/Users/jayakrishna/.gemini/antigravity-ide/brain/cab227a9-7293-4978-80ff-e8b95086102c';

async function run() {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

  console.log('1. Navigating to http://localhost:5173/ ...');
  await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 600));

  // Seed consent, active user, and skip splash
  await page.evaluate(() => {
    sessionStorage.setItem('findlostpuppy_launch_seen', 'true');
    const user = {
      id: 'test-owner-1',
      name: 'Jaya Krishna',
      email: 'jksurampudi5@gmail.com',
      phone: '9876543210',
      avatar: ''
    };
    localStorage.setItem('findlostpuppy_active_user', JSON.stringify(user));

    const consentRecord = {
      consentVersion: '1.0',
      termsVersion: '1.0',
      privacyVersion: '1.0',
      disclaimerVersion: '1.0',
      guidelinesVersion: '1.0',
      agreedAt: new Date().toISOString(),
      userId: 'test-owner-1',
      appVersion: '0.1.0',
      acceptedForms: {
        terms: true,
        privacy: true,
        disclaimer: true,
        guidelines: true,
        declaration: true
      },
      consentMethod: 'master_declaration'
    };
    localStorage.setItem('findlostpuppy_consent_v1', JSON.stringify(consentRecord));
  });

  const hideSplashAndCheck = async (screenshotName) => {
    await page.evaluate(() => {
      const splash = document.querySelector('.launch-overlay-backdrop');
      if (splash) splash.style.display = 'none';
    });
    await new Promise(r => setTimeout(r, 800));
    const outPath = path.join(artifactDir, screenshotName);
    await page.screenshot({ path: outPath, fullPage: false });
    console.log(`Saved screenshot: ${screenshotName}`);
    return outPath;
  };

  // 1. Dashboard Test
  console.log('Testing Dashboard (/dashboard)...');
  await page.goto('http://localhost:5173/dashboard', { waitUntil: 'domcontentloaded' });
  await hideSplashAndCheck('localhost_dashboard_390.png');

  const dashStyles = await page.evaluate(() => {
    const title = document.querySelector('.dashboard-brand-title') || document.querySelector('h1');
    const computedFont = title ? window.getComputedStyle(title).fontFamily : 'not-found';
    const isOverflowing = document.documentElement.scrollWidth > window.innerWidth;
    return { titleFont: computedFont, isOverflowing };
  });
  console.log('Dashboard Info:', dashStyles);

  // 2. Owner Contact Page Test (/owner)
  console.log('Testing Owner Contact (/owner)...');
  await page.goto('http://localhost:5173/owner', { waitUntil: 'domcontentloaded' });
  await hideSplashAndCheck('localhost_owner_390.png');

  const ownerMetrics = await page.evaluate(() => {
    const inputs = document.querySelectorAll('.owner-modern-input');
    const wrappers = document.querySelectorAll('.owner-modern-input-wrapper');
    const labels = document.querySelectorAll('.owner-modern-label');
    const inputHeights = Array.from(inputs).map(i => {
      const rect = i.getBoundingClientRect();
      const style = window.getComputedStyle(i);
      return { id: i.id || i.name, height: Math.round(rect.height), fontSize: style.fontSize };
    });
    const wrapperHeights = Array.from(wrappers).map(w => {
      const rect = w.getBoundingClientRect();
      return { height: Math.round(rect.height), width: Math.round(rect.width) };
    });
    const labelTexts = Array.from(labels).map(l => l.innerText.trim());
    const isOverflowing = document.documentElement.scrollWidth > window.innerWidth;
    return { inputHeights, wrapperHeights, labelTexts, isOverflowing };
  });
  console.log('Owner Metrics:', JSON.stringify(ownerMetrics, null, 2));

  // 3. Location Page Test (/location)
  console.log('Testing Location Onboarding (/location)...');
  await page.goto('http://localhost:5173/location', { waitUntil: 'domcontentloaded' });
  await hideSplashAndCheck('localhost_location_390.png');

  const locMetrics = await page.evaluate(() => {
    const isOverflowing = document.documentElement.scrollWidth > window.innerWidth;
    const buttons = Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim()).slice(0, 5);
    return { isOverflowing, sampleButtons: buttons };
  });
  console.log('Location Metrics:', locMetrics);

  // 4. Pet Profile Test (/pet)
  console.log('Testing Pet Profile (/pet)...');
  await page.goto('http://localhost:5173/pet', { waitUntil: 'domcontentloaded' });
  await hideSplashAndCheck('localhost_pet_390.png');

  const petMetrics = await page.evaluate(() => {
    const isOverflowing = document.documentElement.scrollWidth > window.innerWidth;
    const inputs = Array.from(document.querySelectorAll('.owner-modern-input')).map(i => ({
      id: i.id || i.name,
      height: Math.round(i.getBoundingClientRect().height)
    }));
    return { isOverflowing, inputs };
  });
  console.log('Pet Metrics:', petMetrics);

  // 5. Test 360px small viewport on Owner
  await page.setViewport({ width: 360, height: 640, isMobile: true, hasTouch: true });
  await page.goto('http://localhost:5173/owner', { waitUntil: 'domcontentloaded' });
  await hideSplashAndCheck('localhost_owner_360.png');

  const small360Overflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth > window.innerWidth;
  });
  console.log('360px Small Viewport Overflowing:', small360Overflow);

  await browser.close();
  console.log('Verification completed successfully!');
}

run().catch(console.error);
