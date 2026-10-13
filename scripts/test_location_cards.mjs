import assert from 'node:assert/strict';
import puppeteer from 'puppeteer-core';

// Real React/browser regression against localhost, isolated from personal storage
// and every external service. No real Firebase writes or location requests.
const base = process.env.LOCATION_TEST_URL || 'http://127.0.0.1:5173/findlostpuppy/';
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
});
const expected = ['Telangana', 'Vikarabad', 'Vikarabad', 'Yennaepally'];
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
let providerMode = 'success';
let page;
const errors = [];
try {
  page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844 });
  page.on('pageerror', error => errors.push(error.message));
  await page.setRequestInterception(true);
  page.on('request', request => {
    const url = new URL(request.url());
    if (['127.0.0.1', 'localhost'].includes(url.hostname) || ['data:', 'blob:'].includes(url.protocol)) {
      return request.continue();
    }
    if (url.hostname === 'nominatim.openstreetmap.org') {
      return request.respond({ contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({
        address: { state: 'Telangana', state_district: 'Vikarabad', subdistrict: 'Vikarabad',
          ...(providerMode === 'missing-village' ? {} : { village: 'Yennaepally', postcode: '501101' }), road: 'Synthetic Lane' },
      }) });
    }
    if (url.hostname === 'api.postalpincode.in') {
      return request.respond({ contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify([{ Status: 'Error', PostOffice: null }]) });
    }
    return request.abort();
  });
  await page.evaluateOnNewDocument(() => {
    if (!localStorage.getItem('location_cards_fixture')) {
      localStorage.setItem('location_cards_fixture', 'true');
      localStorage.setItem('findlostpuppy_master_photo_reset_v5', 'true');
      localStorage.setItem('findlostpuppy_active_user', JSON.stringify({
        id: 'location-cards-fixture', name: 'Synthetic Owner', email: 'location@example.invalid', createdAt: '2026-01-01',
      }));
      localStorage.setItem('findlostpuppy_profiles_v1', JSON.stringify([{
        id: 'location-cards-fixture', userId: 'location-cards-fixture', fullName: 'Synthetic Owner',
        phone: '9876543210', email: 'location@example.invalid',
        photo: 'https://res.cloudinary.com/synthetic/image/upload/owner-fixture.jpg',
        state: '', district: '', mandalOrMunicipality: '', city: '', preferredContact: 'phone', updatedAt: '2026-01-01',
      }]));
      localStorage.setItem('findlostpuppy_consent_accepted_location-cards-fixture', 'true');
      localStorage.setItem('findlostpuppy_has_accepted_consent', 'true');
      localStorage.setItem('findlostpuppy_gratitude_seen', 'true');
    }
    sessionStorage.setItem('findlostpuppy_launch_seen', 'true');
    sessionStorage.setItem('flp_geo_check_v1', JSON.stringify({ allowed: true, countryCode: 'IN' }));
    window.__locationMode = 'success';
    window.__geoCalls = 0;
    navigator.permissions.query = async () => ({ state: window.__locationMode === 'denied' ? 'denied' : 'granted' });
    navigator.geolocation.getCurrentPosition = (success, error) => {
      window.__geoCalls++;
      const deliver = () => success({ coords: { latitude: 1, longitude: 2, accuracy: 10 }, timestamp: Date.now() });
      if (window.__locationMode === 'pending') window.__resolveGeo = deliver;
      else if (window.__locationMode === 'error') setTimeout(() => error({ code: 2, message: 'Synthetic location unavailable' }), 20);
      else setTimeout(deliver, 20);
    };
  });
  const values = () => page.$$eval('.loc-grid-2x2 .loc-gsq-value', nodes => nodes.map(node => node.textContent.trim()));
  const waitForValues = async wanted => {
    await page.waitForFunction(expectedValues => {
      const actual = [...document.querySelectorAll('.loc-grid-2x2 .loc-gsq-value')].map(node => node.textContent.trim());
      return JSON.stringify(actual) === JSON.stringify(expectedValues);
    }, { timeout: 20000 }, wanted);
  };
  const choose = async (title, label) => {
    await page.waitForFunction(wanted => document.querySelector('.pet-selector-modal h3')?.textContent === wanted,
      { timeout: 10000 }, title);
    await page.waitForSelector('.pet-selector-item', { timeout: 10000 });
    return page.$$eval('.pet-selector-item', (buttons, wanted) => {
      const button = wanted ? buttons.find(node => node.querySelector('.pet-selector-item-label')?.textContent === wanted) : buttons[0];
      if (!button) throw new Error('Missing fixture selection');
      const selected = button.querySelector('.pet-selector-item-label').textContent;
      button.click();
      return selected;
    }, label);
  };

  await page.goto(new URL('location', base).href, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('.location-onboarding-card', { timeout: 60000 });
  await waitForValues(expected);
  assert.equal(await page.evaluate(() => window.__geoCalls), 1);
  console.log('PASS: automatic detection populates State, District, Mandal and Home Base once.');
  await page.waitForSelector('.launch-overlay-backdrop', { hidden: true, timeout: 20000 });
  await pause(900);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await waitForValues(expected);
  assert.equal(await page.evaluate(() => window.__geoCalls), 0);
  console.log('PASS: all four fields survive reload without another detection.');

  await page.click('.loc-gsq-state');
  await choose('Select State', 'Andhra Pradesh');
  await pause(200);
  assert.deepEqual(await values(), ['Andhra Pradesh', 'Select District', 'Select Mandal', 'Select Village']);
  const district = await choose('Select District');
  const mandal = await choose('Select Mandal');
  const village = await choose('Select Village / Home Base');
  const manual = ['Andhra Pradesh', district, mandal, village];
  await waitForValues(manual);
  await page.waitForFunction(wanted => {
    const profile = JSON.parse(localStorage.getItem('findlostpuppy_profiles_v1')).find(p => p.userId === 'location-cards-fixture');
    return JSON.stringify([profile.state, profile.district, profile.mandalOrMunicipality, profile.city]) === JSON.stringify(wanted);
  }, { timeout: 10000 }, manual);
  await page.evaluate(() => window.dispatchEvent(new CustomEvent('findlostpuppy_data_synced')));
  await waitForValues(manual);
  console.log('PASS: manual cascade clears children, saves all fields, and survives hydration events.');

  await page.click('.location-reset-btn');
  await waitForValues(expected);
  console.log('PASS: Reset automatically re-detects and fills all four cards.');
  if (process.env.LOCATION_SCREENSHOT) await page.screenshot({ path: process.env.LOCATION_SCREENSHOT, fullPage: true });

  await page.evaluate(() => { window.__locationMode = 'pending'; });
  await page.click('.location-detect-primary-btn');
  await page.waitForFunction(() => Boolean(window.__resolveGeo));
  await page.click('.loc-gsq-state');
  await choose('Select State', 'Andhra Pradesh');
  await page.evaluate(() => window.__resolveGeo());
  await pause(300);
  assert.deepEqual(await values(), ['Andhra Pradesh', 'Select District', 'Select Mandal', 'Select Village']);
  await page.click('.pet-selector-close-btn');
  console.log('PASS: a late detection cannot overwrite a manual selection.');

  providerMode = 'missing-village';
  await page.evaluate(() => { window.__locationMode = 'success'; });
  await page.click('.location-reset-btn');
  await waitForValues(['Telangana', 'Vikarabad', 'Vikarabad', 'Select Village']);
  assert.equal(await page.$eval('.continue-to-pup-btn', button => button.disabled), true);
  console.log('PASS: missing Home Base stays unresolved and cannot be saved as its Mandal.');

  await page.evaluate(() => { window.__locationMode = 'error'; });
  await page.click('.location-reset-btn');
  await page.waitForFunction(() => !document.querySelector('.location-detect-primary-btn').disabled);
  assert.deepEqual(await values(), ['Andhra Pradesh', 'East Godavari', 'Undrajavaram', 'Palangi']);
  console.log('PASS: failed GPS/network detection shows warning and renders fallback cards.');

  await page.evaluate(() => { window.__locationMode = 'denied'; });
  await page.$eval('.location-detect-primary-btn', button => button.click());
  await page.waitForFunction(() => document.body.textContent.includes('Allow location access for FindLostPuppy'));
  console.log('PASS: permission denial gives an actionable recovery message.');
  assert.deepEqual(errors, []);
  console.log('PASS: no uncaught browser errors; all external requests were intercepted.');
} catch (error) {
  console.error('Location browser failure:', {
    path: page ? new URL(page.url()).pathname : 'not loaded',
    errors,
    heading: page ? await page.$eval('body', node => node.innerText.slice(0, 500)).catch(() => 'unavailable') : '',
  });
  throw error;
} finally {
  await browser.close();
}
