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
    if (url.hostname === 'localhost' || ['data:', 'blob:'].includes(url.protocol)) request.continue();
    else request.abort();
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
  assert.equal(await page.$eval('#agree-continue-button', el => el.disabled), true);
  await page.click('[aria-label="Open Terms and Conditions form"]');
  await page.waitForSelector('.legal-form-modal-card');
  assert.equal(await page.$eval('.legal-form-modal-card', el => {
    const r = el.getBoundingClientRect();
    return r.left >= 0 && r.right <= innerWidth + 1;
  }), true, 'Legal modal must fit the phone');
  await page.keyboard.press('Escape');
  await page.waitForSelector('.legal-form-modal-card', { hidden: true });
  await page.click('#toggle-all-forms-btn');
  assert.equal(await page.$eval('#agree-continue-button', el => el.disabled), false);
  await page.click('#toggle-all-forms-btn');
  assert.equal(await page.$eval('#agree-continue-button', el => el.disabled), true);
  await page.evaluate(() => {
    localStorage.setItem('findlostpuppy_active_user', JSON.stringify({ id: 'responsive-local', name: 'Local Test', email: 'test@example.invalid' }));
    localStorage.setItem('findlostpuppy_consent_v1', JSON.stringify({ consentVersion: '1.0', termsVersion: '1.0', privacyVersion: '1.0', disclaimerVersion: '1.0', agreedAt: '2026-01-01' }));
  });
  await page.goto('http://localhost:5173/owner', { waitUntil: 'networkidle2' });
  await page.waitForSelector('.launch-overlay-backdrop', { hidden: true });
  await checkHeader();
  await page.click('.mobile-menu-trigger-btn');
  await page.waitForSelector('.mobile-drawer-panel.drawer-open');
  await page.waitForFunction(() => {
    const r = document.querySelector('.drawer-close-btn').getBoundingClientRect();
    return r.left >= 0 && r.right <= innerWidth;
  });
  await page.click('.drawer-close-btn');
  await page.waitForSelector('.mobile-drawer-panel.drawer-open', { hidden: true });
  await page.waitForFunction(() => document.querySelector('.mobile-drawer-panel').getBoundingClientRect().left >= innerWidth - 1);
  await page.click('.mobile-dog-dock-nav button:nth-child(4)');
  await page.waitForSelector('.single-detect-action-wrap');
  assert.equal(await page.$eval('.single-detect-action-wrap', el => getComputedStyle(el).flexDirection), 'column');
  console.log('PASS: guest/authenticated headers, consent controls, legal modal, mobile drawer, and location navigation at 320px');
} finally { await browser.close(); }
