import puppeteer from 'puppeteer-core';
import { mkdir } from 'node:fs/promises';

async function testAutoDetect() {
  await mkdir('scratch/responsive-audit', { recursive: true });
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--no-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true });

  page.on('console', msg => {
    console.log('[BROWSER]', msg.text());
  });
  page.on('pageerror', err => {
    console.error('[PAGE ERROR]', err);
  });
  page.on('requestfailed', req => {
    console.log('[REQ FAILED]', req.url(), req.failure()?.errorText);
  });
  page.on('response', res => {
    if (res.status() >= 400) {
      console.log('[HTTP ' + res.status() + ']', res.url());
    }
  });

  const context = browser.defaultBrowserContext();
  await context.overridePermissions('http://localhost:5173', ['geolocation']);
  await page.setGeolocation({ latitude: 17.4852, longitude: 78.3421, accuracy: 14.5 });
  await page.evaluateOnNewDocument(() => {
    sessionStorage.setItem('findlostpuppy_launch_seen', 'true');
    localStorage.setItem('findlostpuppy_active_user', JSON.stringify({ id: 'test-1', name: 'Tester', email: 'test@example.com' }));
    localStorage.setItem('findlostpuppy_consent_v1', JSON.stringify({
      consentVersion: '1.0', termsVersion: '1.0', privacyVersion: '1.0', disclaimerVersion: '1.0', guidelinesVersion: '1.0',
      agreedAt: new Date().toISOString(), appVersion: '0.1.0',
      acceptedForms: { terms: true, privacy: true, disclaimer: true, guidelines: true, declaration: true },
      consentMethod: 'master_declaration'
    }));
    localStorage.setItem('findlostpuppy_profiles_v1', JSON.stringify([{
      id: 'owner-test-1', userId: 'test-1', fullName: 'Tester', phone: '9876543210', email: 'test@example.com',
      state: '', district: '', mandalOrMunicipality: '', city: '', updatedAt: new Date().toISOString(),
    }]));
  });

  await page.goto('http://localhost:5173/location', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    const splash = document.querySelector('.launch-overlay-backdrop');
    if (splash) splash.style.display = 'none';
  });

  await new Promise(r => setTimeout(r, 600));

  console.log('Testing navigator.geolocation directly in browser page...');
  const geoResult = await page.evaluate(async () => {
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        pos => resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          acc: pos.coords.accuracy
        }),
        err => resolve({ error: err.message, code: err.code }),
        { timeout: 5000, enableHighAccuracy: true }
      );
    });
  });
  console.log('Direct Geolocation Result in page:', geoResult);

  console.log('Triggering Auto Detect via page.click...');
  await page.waitForSelector('.location-detect-primary-btn', { timeout: 10000 });
  await page.click('.location-detect-primary-btn');
  console.log('Clicked! Waiting for location resolution...');
  await new Promise(r => setTimeout(r, 6000));

  const resultState = await page.evaluate(() => {
    const values = [...document.querySelectorAll('.loc-grid-showcase .loc-gsq-value')]
      .map(el => el.textContent?.trim() || '');
    const continueVisible = [...document.querySelectorAll('button')]
      .some(button => button.textContent?.includes('Continue to Pet Details') && !button.disabled);
    const synced = document.body.textContent?.includes('Location Synced') || false;
    return {
      state: values[0] || '',
      district: values[1] || '',
      mandal: values[2] || '',
      homeBase: values[3] || '',
      continueVisible,
      synced
    };
  });

  console.log('Form State After Auto-Detect:', JSON.stringify(resultState, null, 2));

  const shotPath = 'scratch/responsive-audit/autodetect_verified_390.png';
  await page.screenshot({ path: shotPath, fullPage: false });
  console.log('Saved autodetect screenshot to:', shotPath);

  await browser.close();
}

testAutoDetect().catch(console.error);
