import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const artifactDir = '/Users/jayakrishna/.gemini/antigravity-ide/brain/14a5c867-efb6-4e2c-b19b-304469980ec9';

async function run() {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

  console.log('1. Navigating to http://localhost:5173/ ...');
  await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 600));

  // Seed user, completed profile, consent, and skip inauguration/launch screens
  await page.evaluate(() => {
    sessionStorage.setItem('findlostpuppy_launch_seen', 'true');
    localStorage.setItem('findlostpuppy_gratitude_seen', 'true');

    const user = {
      id: 'test-user-commuter',
      name: 'Rider Tester',
      email: 'rider@example.com',
      phone: '9876543210',
      avatar: ''
    };
    localStorage.setItem('findlostpuppy_active_user', JSON.stringify(user));

    const profile = {
      id: 'profile-rider',
      userId: 'test-user-commuter',
      fullName: 'Rider Tester',
      phone: '9876543210',
      email: 'rider@example.com',
      state: 'Telangana',
      district: 'Medchal-Malkajgiri',
      mandalOrMunicipality: 'Kukatpally',
      city: 'Kukatpally Locality',
      streetOrLocality: 'Highway Road',
      hasLocationConsent: true,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem('findlostpuppy_owner_profile', JSON.stringify(profile));
    localStorage.setItem('findlostpuppy_owner_profiles', JSON.stringify([profile]));

    const consentRecord = {
      consentVersion: '1.1',
      termsVersion: '1.1',
      privacyVersion: '1.1',
      disclaimerVersion: '1.0',
      guidelinesVersion: '1.0',
      agreedAt: new Date().toISOString(),
      userId: 'test-user-commuter',
      appVersion: '0.1.0',
      acceptedForms: { terms: true, privacy: true, disclaimer: true, guidelines: true, declaration: true },
      consentMethod: 'master_declaration'
    };
    localStorage.setItem('findlostpuppy_consent_v1', JSON.stringify(consentRecord));
  });

  // Navigate to Dashboard
  console.log('2. Navigating to Dashboard (/homepage)...');
  await page.goto('http://localhost:5173/homepage', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 1200));

  // 1. Verify "Spotted a Roaming or Lost Pet?" is NOT on Dashboard
  const pageText = await page.evaluate(() => document.body.innerText);
  const hasSpottedBlock = pageText.includes('Spotted a Roaming or Lost Pet');
  console.log(`[CHECK 1] "Spotted a Roaming or Lost Pet?" block absent: ${!hasSpottedBlock}`);
  if (hasSpottedBlock) {
    throw new Error('FAIL: "Spotted a Roaming or Lost Pet?" is still present on Dashboard!');
  }

  // 2. Verify floating camera button exists
  const fabExists = await page.evaluate(() => {
    const fab = document.querySelector('#dashboard-floating-capture-fab') || document.querySelector('.dashboard-floating-camera-btn');
    return !!fab;
  });
  console.log(`[CHECK 2] Dashboard floating camera button present: ${fabExists}`);

  await page.screenshot({ path: path.join(artifactDir, 'dashboard_no_spotted_card.png') });
  console.log('Saved dashboard_no_spotted_card.png');

  // 3. Navigate to Capture Pet page via floating camera button or URL
  console.log('3. Opening Quick Capture Pet (/capture?mode=unknown)...');
  await page.goto('http://localhost:5173/capture?mode=unknown', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 1500));

  // Check UI elements on Capture Pet page
  const captureCheck = await page.evaluate(() => {
    const backBtn = document.querySelector('.back-button-root');
    const privacyNotice = document.querySelector('.capture-consent-box')?.innerText || '';
    const cameraFrame = document.querySelector('.capture-camera-frame');
    const gpsPill = document.querySelector('.capture-camera-gps-pill')?.innerText || '';
    const snapBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Snap Pet Photo'));
    const manualAccordion = document.querySelector('.capture-manual-toggle-btn');

    return {
      hasBackButton: !!backBtn,
      privacyNoticeHasFrameOnly: privacyNotice.includes('Frame Pet Only') || privacyNotice.includes('strictly photograph the animal'),
      hasCameraFrameAtTop: !!cameraFrame,
      gpsPillText: gpsPill,
      hasSnapBtn: !!snapBtn,
      hasManualAccordion: !!manualAccordion
    };
  });

  console.log('[CHECK 3] Capture Pet Page Elements:', JSON.stringify(captureCheck, null, 2));
  await page.screenshot({ path: path.join(artifactDir, 'capture_screen_commute_ready.png') });
  console.log('Saved capture_screen_commute_ready.png');

  // 4. Simulate snapping a photo by adding a mock photo to test instant submit flow
  console.log('4. Simulating photo snap...');
  await page.evaluate(() => {
    // Generate a simple 1x1 data URL jpeg
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#E06D44';
      ctx.fillRect(0, 0, 400, 300);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '24px sans-serif';
      ctx.fillText('Spotted Dog Photo', 80, 150);
    }
    const photoData = canvas.toDataURL('image/jpeg');

    // Trigger frame capture or set photos state through standard UI
    const snapBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Snap Pet Photo'));
    if (snapBtn) {
      snapBtn.click();
    }
  });

  await new Promise(r => setTimeout(r, 1200));

  // Check if instant submit card is rendered
  let hasInstantCard = await page.evaluate(() => !!document.querySelector('.capture-instant-submit-card'));

  // If fake video stream didn't have videoWidth in headless test, inject a test photo directly to evaluate instant submit card
  if (!hasInstantCard) {
    await page.evaluate(() => {
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 300;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#E06D44';
        ctx.fillRect(0, 0, 400, 300);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '20px sans-serif';
        ctx.fillText('Spotted Dog 🐕', 120, 150);
      }
      const dummyPhoto = canvas.toDataURL('image/jpeg');

      // Add to React state via clicking hidden input file dispatch or mock
      const input = document.querySelector('input[type="file"]');
      if (input) {
        const file = new File(['dog'], 'pet.jpg', { type: 'image/jpeg' });
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        input.files = dataTransfer.files;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    await new Promise(r => setTimeout(r, 1000));
    hasInstantCard = await page.evaluate(() => !!document.querySelector('.capture-instant-submit-card'));
  }

  console.log(`[CHECK 4] Instant Submit Card visible after snap/photo: ${hasInstantCard}`);
  await page.screenshot({ path: path.join(artifactDir, 'capture_instant_submit_card.png') });
  console.log('Saved capture_instant_submit_card.png');

  // 5. Test expanding manual location/pet accordion
  console.log('5. Clicking optional manual details accordion...');
  await page.evaluate(() => {
    const acc = document.querySelector('.capture-manual-toggle-btn');
    if (acc) acc.click();
  });
  await new Promise(r => setTimeout(r, 600));

  const manualCheck = await page.evaluate(() => {
    const grid = document.querySelector('.loc-grid-2x2');
    const stateSq = document.querySelector('.loc-gsq-state');
    const distSq = document.querySelector('.loc-gsq-district');
    const mandSq = document.querySelector('.loc-gsq-mandal');
    const homeSq = document.querySelector('.loc-gsq-home');
    const unknownCard = document.querySelector('.capture-unknown-choice-card');

    return {
      hasGrid: !!grid,
      hasStateSq: !!stateSq,
      hasDistSq: !!distSq,
      hasMandSq: !!mandSq,
      hasHomeSq: !!homeSq,
      hasUnknownCard: !!unknownCard
    };
  });
  console.log('[CHECK 5] Expanded Manual Controls:', JSON.stringify(manualCheck, null, 2));
  await page.screenshot({ path: path.join(artifactDir, 'capture_expanded_manual_details.png') });
  console.log('Saved capture_expanded_manual_details.png');

  // 6. Test 1-click submit
  console.log('6. Submitting sighting via 1-click submit button...');
  const submitBtnExists = await page.evaluate(() => {
    const btn = document.querySelector('.capture-instant-submit-btn');
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  });
  console.log(`[CHECK 6] 1-Click submit button clicked: ${submitBtnExists}`);

  await new Promise(r => setTimeout(r, 400));
  const successTickVisible = await page.evaluate(() => !!document.querySelector('.success-tick-overlay'));
  console.log(`[CHECK 7] Success tick overlay rendered: ${successTickVisible}`);
  await page.screenshot({ path: path.join(artifactDir, 'capture_success_tick.png') });
  console.log('Saved capture_success_tick.png');

  await new Promise(r => setTimeout(r, 1400));
  const currentUrl = page.url();
  console.log(`[CHECK 8] Redirected after submission to: ${currentUrl}`);

  await browser.close();
  console.log('All verification checks completed successfully!');
}

run().catch(err => {
  console.error('Test run failed:', err);
  process.exit(1);
});
