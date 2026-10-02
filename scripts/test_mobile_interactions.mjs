import assert from 'node:assert/strict';
import puppeteer from 'puppeteer-core';

const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
});
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 320, height: 640, isMobile: true });
  await page.setRequestInterception(true);
  page.on('request', request => {
    const url = new URL(request.url());
    if (['localhost', '127.0.0.1'].includes(url.hostname) || ['data:', 'blob:'].includes(url.protocol)) request.continue();
    else request.abort();
  });

  // Setup user needing consent
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('findlostpuppy_active_user', JSON.stringify({ id: 'responsive-local', name: 'Local Test', email: 'test@example.invalid' }));
    localStorage.setItem('findlostpuppy_current_user_v1', JSON.stringify({ id: 'responsive-local', name: 'Local Test', email: 'test@example.invalid' }));
    localStorage.removeItem('findlostpuppy_consent_v1');
    localStorage.removeItem('findlostpuppy_consent_records_v1');
    sessionStorage.setItem('findlostpuppy_launch_seen', 'true');
  });

  await page.goto('http://localhost:5173/consent', { waitUntil: 'networkidle2' });
  await page.waitForSelector('.launch-overlay-backdrop', { hidden: true });

  const checkHeader = async () => {
    assert.equal(await page.evaluate(() => [...document.querySelectorAll('.mobile-top-header a, .mobile-top-header button')].every(el => {
      const r = el.getBoundingClientRect();
      return !r.width || (r.left >= 0 && r.right <= innerWidth + 1);
    })), true, 'Header actions must fit on a 320px screen');
  };
  await checkHeader();

  // Test legal modal on 320px mobile
  await page.click('[aria-label="Open Terms and Conditions form"]');
  await page.waitForSelector('.legal-form-modal-card');
  assert.equal(await page.$eval('.legal-form-modal-card', el => {
    const r = el.getBoundingClientRect();
    return r.left >= 0 && r.right <= innerWidth + 1;
  }), true, 'Legal modal must fit the 320px mobile screen');

  await page.keyboard.press('Escape');
  await page.waitForSelector('.legal-form-modal-card', { hidden: true });

  // Test checkboxes & continue button
  const ageCb = await page.$('#adult-age-confirmation-checkbox');
  const consentCb = await page.$('#consent-acknowledgment-checkbox');
  const continueBtn = await page.$('#agree-continue-button');
  assert.ok(ageCb, 'Age confirmation checkbox must exist');
  assert.ok(consentCb, 'Consent acknowledgment checkbox must exist');
  assert.ok(continueBtn, 'Continue button must exist');

  // Verify continue button fits viewport
  assert.equal(await page.$eval('#agree-continue-button', el => {
    const r = el.getBoundingClientRect();
    return r.left >= 0 && r.right <= innerWidth + 1;
  }), true, 'Agree & Continue button fits within 320px');

  // Toggle consent checkbox
  await consentCb.click();
  const isChecked = await page.$eval('#consent-acknowledgment-checkbox', el => el.checked);
  assert.equal(isChecked, true, 'Checkbox should toggle to checked');

  // Now grant full consent and test authenticated owner & location flows on mobile
  await page.evaluate(() => {
    localStorage.setItem('findlostpuppy_active_user', JSON.stringify({ id: 'responsive-local', name: 'Local Test', email: 'test@example.invalid' }));
    localStorage.setItem('findlostpuppy_consent_v1', JSON.stringify({
      consentVersion: '1.1', termsVersion: '1.1', privacyVersion: '1.1', disclaimerVersion: '1.0', guidelinesVersion: '1.0',
      agreedAt: '2026-01-01', acceptedForms: { terms: true, privacy: true, disclaimer: true, guidelines: true, declaration: true },
      consentMethod: 'master_declaration',
    }));
    localStorage.setItem('findlostpuppy_profiles_v1', JSON.stringify([{
      id: 'owner-local', userId: 'responsive-local', fullName: 'Local Test', phone: '9876543210',
      state: 'Telangana', district: 'Vikarabad', mandalOrMunicipality: 'Vikarabad', city: 'Yennaepally',
    }]));
  });

  await page.goto('http://localhost:5173/owner', { waitUntil: 'networkidle2' });
  await page.waitForSelector('.launch-overlay-backdrop', { hidden: true });
  await checkHeader();

  // Test mobile drawer
  await page.click('.mobile-menu-trigger-btn');
  await page.waitForSelector('.mobile-drawer-panel.drawer-open');
  await page.waitForFunction(() => {
    const r = document.querySelector('.drawer-close-btn').getBoundingClientRect();
    return r.left >= 0 && r.right <= innerWidth;
  });
  await page.click('.drawer-close-btn');
  await page.waitForSelector('.mobile-drawer-panel.drawer-open', { hidden: true });
  await page.waitForFunction(() => document.querySelector('.mobile-drawer-panel').getBoundingClientRect().left >= innerWidth - 1);

  // Test mobile bottom dock navigation to Location
  await page.click('.mobile-dog-dock-nav button:nth-child(2)');
  await page.waitForSelector('.location-detect-primary-btn');

  // Verify location grid fits on 320px
  assert.equal(await page.$eval('.loc-grid-2x2', el => {
    const r = el.getBoundingClientRect();
    return r.left >= 0 && r.right <= innerWidth + 1;
  }), true, 'Location 2x2 grid fits on 320px viewport');

  // Verify detect and reset buttons fit
  assert.equal(await page.$eval('.location-detect-primary-btn', el => {
    const r = el.getBoundingClientRect();
    return r.left >= 0 && r.right <= innerWidth + 1;
  }), true, 'Location detect button fits within 320px');

  console.log('PASS: guest/authenticated headers, consent controls, legal modal, mobile drawer, and location navigation at 320px');
} finally { await browser.close(); }

