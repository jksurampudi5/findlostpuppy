import puppeteer from 'puppeteer-core';
const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

async function testCapturePetFlow() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream']
  });
  const page = await browser.newPage();
  const logs = [];
  page.on('console', msg => logs.push(`[${msg.type()}] ${msg.text()}`));

  await page.goto('http://localhost:5173/homepage', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    localStorage.clear();
    const user = { id: 'test-user-1', name: 'Tester', email: 'test@example.com' };
    localStorage.setItem('findlostpuppy_active_user', JSON.stringify(user));
    localStorage.setItem('findlostpuppy_current_user', JSON.stringify(user));
    localStorage.setItem('findlostpuppy_has_accepted_consent', 'true');
    localStorage.setItem('findlostpuppy_consent_accepted_test-user-1', 'true');
    localStorage.setItem('findlostpuppy_returning_user_test-user-1', 'true');

    const report = {
      id: 'REP-TEST-1',
      dogId: 'dog-1',
      ownerId: 'owner-1',
      dog: { name: 'Rocky', breed: 'Indie', primaryPhoto: '' },
      status: 'LOST',
      lastKnownLocation: 'Palangi, Undrajavaram, East Godavari',
      createdAt: new Date().toISOString()
    };
    localStorage.setItem('findlostpuppy_reports_v1', JSON.stringify([report]));
  });

  await page.goto('http://localhost:5173/capture', { waitUntil: 'networkidle2' });

  // Wait for session check to finish and capture card to appear
  await page.waitForSelector('.capture-pet-card', { timeout: 30000 });

  // Check permission panel
  const permPanelText = await page.$eval('.capture-permission-panel', el => el.innerText).catch(() => null);
  console.log('Permission panel text:', permPanelText?.split('\n')[0]);

  // Click Turn On Camera
  const turnOnBtn = await page.$('.capture-permission-panel button');
  if (turnOnBtn) {
    console.log('Found Turn On Camera button, clicking...');
    await turnOnBtn.click();
    await new Promise(r => setTimeout(r, 1000));
  }

  // Check if camera rationale modal appeared or camera started
  const rationaleAccept = await page.$('.capture-rationale-accept');
  if (rationaleAccept) {
    console.log('Found camera rationale modal, accepting...');
    await rationaleAccept.click();
    await new Promise(r => setTimeout(r, 1500));
  }

  // Check button text
  const mainBtnText = await page.$eval('.capture-main-button span', el => el.innerText).catch(() => null);
  console.log('Main capture button text:', mainBtnText);

  // Capture Photo 1
  const captureBtn = await page.$('.capture-main-button');
  if (captureBtn) {
    await captureBtn.click();
    await new Promise(r => setTimeout(r, 800));
    console.log('Captured photo 1!');
  }

  // Check if Skip/Done button appeared!
  const skipBtnText = await page.$eval('.capture-skip-proceed-btn span', el => el.innerText).catch(() => null);
  console.log('Skip / Proceed button text:', skipBtnText);

  // Check button text now for Photo 2
  const nextBtnText = await page.$eval('.capture-main-button span', el => el.innerText).catch(() => null);
  console.log('Next capture button text:', nextBtnText);

  // Now click Done / Skip Remaining
  const skipBtn = await page.$('.capture-skip-proceed-btn');
  if (skipBtn) {
    console.log('Clicking Done / Skip Remaining (1/3)...');
    await skipBtn.click();
    await new Promise(r => setTimeout(r, 800));
  }

  // Check if Review Modal opened
  await page.waitForSelector('.capture-review-modal', { timeout: 5000 }).catch(() => null);
  const reviewTitle = await page.$eval('#capture-review-title', el => el.innerText).catch(() => null);
  console.log('Review modal title:', reviewTitle);

  // Accept location in review modal if needed
  const locAcceptBtn = await page.$('.capture-location-consent-accept');
  if (locAcceptBtn) {
    console.log('Accepting location consent in review modal...');
    await locAcceptBtn.click();
    await new Promise(r => setTimeout(r, 800));
  }

  // Verify submit button exists
  const submitBtn = await page.$('.capture-review-submit-btn');
  const submitBtnText = await page.$eval('.capture-review-submit-btn', el => el.innerText).catch(() => null);
  console.log('Submit button text in review modal:', submitBtnText);

  if (submitBtn) {
    console.log('Submitting sighting...');
    await submitBtn.click();
    await new Promise(r => setTimeout(r, 3500));
    console.log('Post-submit URL:', page.url());
  }

  // Check if sighting was saved to localStorage
  const sightings = await page.evaluate(() => {
    return JSON.parse(localStorage.getItem('findlostpuppy_sightings_v1') || '[]');
  });
  console.log('Sightings in localStorage count:', sightings.length);
  if (sightings.length > 0) {
    console.log('Sighting photo URL:', sightings[0].photo);
    console.log('Is Cloudinary URL:', sightings[0].photo?.includes('res.cloudinary.com'));
  }

  console.log('\nRelevant browser logs:');
  logs.filter(l => l.includes('storageBucketService') || l.includes('Upload')).forEach(l => console.log(l));

  await browser.close();
}

testCapturePetFlow().catch(e => {
  console.error('Test error:', e);
  process.exit(1);
});
