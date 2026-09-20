import puppeteer from 'puppeteer-core';
import { mkdir, writeFile } from 'node:fs/promises';

// Isolated browser data and blocked external requests keep this audit local.
const output = process.env.AUDIT_OUTPUT || 'scratch/responsive-audit';
await mkdir(output, { recursive: true });
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
});
const results = [];
try {
  const page = await browser.newPage();
  await page.setRequestInterception(true);
  page.on('request', request => {
    const url = new URL(request.url());
    if (['localhost', '127.0.0.1'].includes(url.hostname) || ['data:', 'blob:'].includes(url.protocol)) request.continue();
    else request.abort();
  });
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('findlostpuppy_active_user', JSON.stringify({
      id: 'responsive-test-local', name: 'Test Pet Parent', email: 'responsive@example.invalid',
      createdAt: '2026-01-01T00:00:00Z',
    }));
    localStorage.setItem('findlostpuppy_consent_v1', JSON.stringify({
      consentVersion: '1.0', termsVersion: '1.0', privacyVersion: '1.0', disclaimerVersion: '1.0',
      guidelinesVersion: '1.0', agreedAt: '2026-01-01T00:00:00Z',
    }));
  });
  for (const width of (process.env.AUDIT_WIDTHS || '320,390,768,1024').split(',').map(Number)) {
    await page.setViewport({ width, height: 844, deviceScaleFactor: 1 });
    for (const route of (process.env.AUDIT_ROUTES || 'consent,login,owner,location,pet,alert,dashboard,find').split(',')) {
      await page.goto(`http://localhost:5173/${route}`, { waitUntil: 'networkidle2' });
      await page.waitForSelector('.launch-overlay-backdrop', { hidden: true, timeout: 15000 });
      const result = await page.evaluate(() => {
        const width = document.documentElement.clientWidth;
        const outside = [...document.querySelectorAll('main input, main button, main select, main h1, main h2, .mobile-top-header button')]
          .filter(el => {
            const r = el.getBoundingClientRect();
            return r.width > 0 && r.height > 0 && (r.left < -1 || r.right > width + 1);
          }).map(el => ({ tag: el.tagName, class: el.className, text: el.textContent?.slice(0, 50) }));
        const card = document.querySelector('.owner-combined-card, .location-onboarding-card, .pet-combined-card, .auth-card, .consent-form-card');
        return { scrollWidth: document.documentElement.scrollWidth, outside,
          cardPadding: card ? getComputedStyle(card).padding : null,
          heading: document.querySelector('main h1, main h2')?.textContent };
      });
      results.push({ width, route, ...result });
      await page.screenshot({ path: `${output}/${route}-${width}.png`, fullPage: true });
      console.log(JSON.stringify(results.at(-1)));
    }
  }
} finally {
  await browser.close();
  await writeFile(`${output}/results.json`, JSON.stringify(results, null, 2));
}
if (results.some(r => r.scrollWidth > r.width + 1 || r.outside.length)) process.exitCode = 1;
