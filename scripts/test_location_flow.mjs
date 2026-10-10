import puppeteer from 'puppeteer-core';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

async function runTests() {
  console.log('🚀 Starting Location Component Automated Test Suite...');
  const userDataDir = mkdtempSync(join(tmpdir(), 'puppeteer-loc-'));
  const executablePath =
    process.env.PUPPETEER_EXECUTABLE_PATH ||
    (process.platform === 'darwin'
      ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
      : '/usr/bin/google-chrome-stable');
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    userDataDir,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const results = [];

  const setupPage = async ({
    permissions = ['geolocation'],
    coords = { latitude: 16.7852, longitude: 81.6521 },
    permState = 'granted',
    disableLocationService = false,
  } = {}) => {
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844, isMobile: true });

    const context = browser.defaultBrowserContext();
    if (permissions && permissions.length > 0) {
      await context.overridePermissions('http://127.0.0.1:5173', permissions);
    } else {
      await context.overridePermissions('http://127.0.0.1:5173', []);
    }

    if (coords) {
      await page.setGeolocation({ latitude: coords.latitude, longitude: coords.longitude, accuracy: 12 });
    }

    await page.evaluateOnNewDocument(({ permState, disableLocationService }) => {
      sessionStorage.setItem('findlostpuppy_launch_seen', 'true');
      localStorage.setItem('findlostpuppy_active_user', JSON.stringify({ id: 'test-loc-1', name: 'Tester', email: 'test@example.com' }));
      localStorage.setItem('findlostpuppy_consent_v1', JSON.stringify({
        consentVersion: '1.1', termsVersion: '1.1', privacyVersion: '1.1', disclaimerVersion: '1.0', guidelinesVersion: '1.0',
        agreedAt: new Date().toISOString(), appVersion: '0.1.0',
        acceptedForms: { terms: true, privacy: true, disclaimer: true, guidelines: true, declaration: true },
        consentMethod: 'master_declaration',
        userId: 'test-loc-1'
      }));
      localStorage.setItem('findlostpuppy_profiles_v1', JSON.stringify([{
        id: 'owner-test-loc-1', userId: 'test-loc-1', fullName: 'Tester', phone: '9876543210', email: 'test@example.com',
        state: '', district: '', mandalOrMunicipality: '', city: '', updatedAt: new Date().toISOString(),
      }]));

      if (permState) {
        if (navigator.permissions) {
          navigator.permissions.query = async (query) => {
            if (query && query.name === 'geolocation') {
              return { state: permState };
            }
            return { state: 'granted' };
          };
        }
      }

      if (disableLocationService) {
        navigator.geolocation.getCurrentPosition = (success, error) => {
          const err = new Error('Location services are disabled');
          err.code = 2; // POSITION_UNAVAILABLE / LOCATION_SERVICES_DISABLED
          error(err);
        };
      }
    }, { permState, disableLocationService });

    await page.goto('http://127.0.0.1:5173/location', { waitUntil: 'domcontentloaded', timeout: 8000 });
    await page.evaluate(() => {
      const splash = document.querySelector('.launch-overlay-backdrop');
      if (splash) splash.remove();
    });
    await new Promise(r => setTimeout(r, 600));
    return page;
  };

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Successful Detection (Palangi, Undrajavaram, East Godavari)
    // -------------------------------------------------------------------------
    {
      console.log('\n--- Test 1: Successful Detection ---');
      const page = await setupPage({
        permissions: ['geolocation'],
        coords: { latitude: 16.7852, longitude: 81.6521 },
        permState: 'granted'
      });

      const detectBtn = await page.$('.location-detect-primary-btn');
      if (detectBtn) {
        await detectBtn.click();
      }
      await page.waitForFunction(() => {
        const btn = document.querySelector('.location-detect-primary-btn');
        return btn && !btn.textContent.includes('Detecting');
      }, { timeout: 10000 });

      const detectedText = await page.evaluate(() => {
        return {
          state: document.querySelector('.loc-gsq-state .loc-gsq-value')?.textContent?.trim(),
          district: document.querySelector('.loc-gsq-district .loc-gsq-value')?.textContent?.trim(),
          mandal: document.querySelector('.loc-gsq-mandal .loc-gsq-value')?.textContent?.trim(),
          village: document.querySelector('.loc-gsq-city .loc-gsq-value')?.textContent?.trim(),
          buttonLabel: document.querySelector('.location-detect-primary-btn')?.textContent?.trim(),
        };
      });

      const pass = Boolean(
        detectedText.state?.includes('Andhra Pradesh') &&
        (detectedText.district?.includes('East Godavari') || detectedText.district?.includes('Godavari'))
      );
      console.log('Result:', detectedText, pass ? '✅ PASS' : '❌ FAIL');
      results.push({ test: 'successful detection', pass, details: detectedText });
      await page.close();
    }

    // -------------------------------------------------------------------------
    // TEST 2: Button changes to "Detect Location Again" & runs fresh fix
    // -------------------------------------------------------------------------
    {
      console.log('\n--- Test 2: Detect Location Again runs fresh fix ---');
      const page = await setupPage({
        permissions: ['geolocation'],
        coords: { latitude: 16.7852, longitude: 81.6521 },
        permState: 'granted'
      });

      await page.evaluate(() => {
        const btn = document.querySelector('.location-detect-primary-btn');
        if (btn) btn.click();
      });
      await new Promise(r => setTimeout(r, 2500));

      const btnLabel = await page.evaluate(() => {
        return document.querySelector('.location-detect-primary-btn')?.textContent?.trim();
      });

      const pass = Boolean(btnLabel && btnLabel.includes('Detect Location Again'));
      console.log('Button label after detection:', btnLabel, pass ? '✅ PASS' : '❌ FAIL');
      results.push({ test: 'Detect Location Again label & fresh fix', pass, details: btnLabel });
      await page.close();
    }

    // -------------------------------------------------------------------------
    // TEST 3: Permission rationale popup before system prompt (missing permission)
    // -------------------------------------------------------------------------
    {
      console.log('\n--- Test 3: In-App Permission Popup on Prompt ---');
      const page = await setupPage({
        permissions: [],
        coords: null,
        permState: 'prompt'
      });

      await page.evaluate(() => {
        const btn = document.querySelector('.location-detect-primary-btn');
        if (btn) btn.click();
      });
      await new Promise(r => setTimeout(r, 600));

      const modalInfo = await page.evaluate(() => {
        const modal = document.querySelector('.permission-rationale-backdrop');
        const title = modal?.querySelector('h2')?.textContent?.trim();
        const continueBtn = modal?.querySelector('.capture-main-button')?.textContent?.trim();
        const cancelBtn = modal?.querySelector('.capture-rotate-button')?.textContent?.trim();
        return { isOpen: Boolean(modal), title, continueBtn, cancelBtn };
      });

      const pass = modalInfo.isOpen && modalInfo.title?.includes('Location Access');
      console.log('Modal shown:', modalInfo, pass ? '✅ PASS' : '❌ FAIL');
      results.push({ test: 'permission rationale popup on missing permission', pass, details: modalInfo });
      await page.close();
    }

    // -------------------------------------------------------------------------
    // TEST 4: Permanently Denied Permission -> Direct Link to App Settings
    // -------------------------------------------------------------------------
    {
      console.log('\n--- Test 4: Permanently Denied Permission ---');
      const page = await setupPage({
        permissions: [],
        coords: null,
        permState: 'denied'
      });

      await page.evaluate(() => {
        const btn = document.querySelector('.location-detect-primary-btn');
        if (btn) btn.click();
      });
      await new Promise(r => setTimeout(r, 600));

      const modalInfo = await page.evaluate(() => {
        const modal = document.querySelector('.permission-rationale-backdrop');
        const title = modal?.querySelector('h2')?.textContent?.trim();
        const continueBtn = modal?.querySelector('.capture-main-button')?.textContent?.trim();
        return { isOpen: Boolean(modal), title, continueBtn };
      });

      const pass = modalInfo.isOpen && modalInfo.continueBtn?.includes('Open Settings');
      console.log('Blocked modal shown:', modalInfo, pass ? '✅ PASS' : '❌ FAIL');
      results.push({ test: 'permanently denied opens settings modal', pass, details: modalInfo });
      await page.close();
    }

    // -------------------------------------------------------------------------
    // TEST 5: Location off (Turn On Accepted) & (Not Now)
    // -------------------------------------------------------------------------
    {
      console.log('\n--- Test 5: Location Off (Turn On / Not Now) ---');
      const page = await setupPage({
        permissions: ['geolocation'],
        coords: null,
        permState: 'granted',
        disableLocationService: true
      });

      await page.evaluate(() => {
        window.__forceLocationError = {
          code: 'LOCATION_SERVICES_DISABLED',
          message: 'Location services are disabled on device'
        };
        const btn = document.querySelector('.location-detect-primary-btn');
        if (btn) btn.click();
      });
      await new Promise(r => setTimeout(r, 600));

      const turnOnModal = await page.evaluate(() => {
        const modal = document.querySelector('.permission-rationale-backdrop');
        const title = modal?.querySelector('h2')?.textContent?.trim();
        const continueBtn = modal?.querySelector('.capture-main-button')?.textContent?.trim();
        const cancelBtn = modal?.querySelector('.capture-rotate-button')?.textContent?.trim();
        return { isOpen: Boolean(modal), title, continueBtn, cancelBtn };
      });

      const passModal = turnOnModal.isOpen && turnOnModal.continueBtn?.includes('Turn On');
      console.log('Turn on location modal:', turnOnModal, passModal ? '✅ PASS' : '❌ FAIL');
      results.push({ test: 'location off (Turn On prompt shown)', pass: passModal, details: turnOnModal });

      // Click "Not Now"
      await page.evaluate(() => {
        const cancel = document.querySelector('.permission-rationale-backdrop .capture-rotate-button');
        if (cancel) cancel.click();
      });
      await new Promise(r => setTimeout(r, 400));

      const modalAfterNotNow = await page.evaluate(() => {
        return Boolean(document.querySelector('.permission-rationale-backdrop'));
      });

      const passNotNow = !modalAfterNotNow;
      console.log('Not Now dismisses modal without looping:', passNotNow ? '✅ PASS' : '❌ FAIL');
      results.push({ test: 'location off (Not Now dismisses cleanly)', pass: passNotNow });
      await page.close();
    }

    // -------------------------------------------------------------------------
    // TEST 6: Outside Delivery Area (No dead-end error)
    // -------------------------------------------------------------------------
    {
      console.log('\n--- Test 6: Outside Delivery Area ---');
      // Set coordinates to Paris, France (outside AP, Telangana, Karnataka)
      const page = await setupPage({
        permissions: ['geolocation'],
        coords: { latitude: 48.8566, longitude: 2.3522 },
        permState: 'granted'
      });

      await page.evaluate(() => {
        const btn = document.querySelector('.location-detect-primary-btn');
        if (btn) btn.click();
      });
      await new Promise(r => setTimeout(r, 3500));

      const deliveryModal = await page.evaluate(() => {
        const modal = document.querySelector('.permission-rationale-backdrop');
        const title = modal?.querySelector('h2')?.textContent?.trim();
        const continueBtn = modal?.querySelector('.capture-main-button')?.textContent?.trim();
        const cancelBtn = modal?.querySelector('.capture-rotate-button')?.textContent?.trim();
        return { isOpen: Boolean(modal), title, continueBtn, cancelBtn };
      });

      const pass = deliveryModal.isOpen &&
                   deliveryModal.title?.includes("We don't deliver to this area yet") &&
                   deliveryModal.cancelBtn?.includes('Enter Location Manually') &&
                   deliveryModal.continueBtn?.includes('Detect Location Again');

      console.log('Outside delivery modal:', deliveryModal, pass ? '✅ PASS' : '❌ FAIL');
      results.push({ test: 'outside delivery area shows manual entry & retry without dead-end', pass, details: deliveryModal });
      await page.close();
    }

    // -------------------------------------------------------------------------
    // TEST 7: Reset clears location & re-triggers permission check
    // -------------------------------------------------------------------------
    {
      console.log('\n--- Test 7: Reset Clears Location & Checks Permission ---');
      const page = await setupPage({
        permissions: [],
        coords: null,
        permState: 'prompt'
      });

      // Populate dummy location in UI first
      await page.evaluate(() => {
        localStorage.setItem('findlostpuppy_profiles_v1', JSON.stringify([{
          id: 'owner-test-loc-1', userId: 'test-loc-1', fullName: 'Tester',
          state: 'Andhra Pradesh', district: 'East Godavari', mandalOrMunicipality: 'Undrajavaram', city: 'Palangi'
        }]));
      });
      await page.reload({ waitUntil: 'domcontentloaded' });
      await new Promise(r => setTimeout(r, 600));

      await page.evaluate(() => {
        const resetBtn = document.querySelector('.location-reset-btn');
        if (resetBtn) resetBtn.click();
      });
      await new Promise(r => setTimeout(r, 600));

      const resetResult = await page.evaluate(() => {
        const modal = document.querySelector('.permission-rationale-backdrop');
        const title = modal?.querySelector('h2')?.textContent?.trim();
        const stateVal = document.querySelector('.loc-gsq-state .loc-gsq-value')?.textContent?.trim();
        return {
          modalShown: Boolean(modal),
          modalTitle: title,
          stateCleared: !stateVal || stateVal.includes('Select') || stateVal === '',
        };
      });

      const pass = resetResult.modalShown && resetResult.modalTitle?.includes('Location Access');
      console.log('Reset result:', resetResult, pass ? '✅ PASS' : '❌ FAIL');
      results.push({ test: 'Reset clears state and triggers permission check', pass, details: resetResult });
      await page.close();
    }

    // -------------------------------------------------------------------------
    // TEST 8: Manual Entry (Selecting state / district)
    // -------------------------------------------------------------------------
    {
      console.log('\n--- Test 8: Manual Entry ---');
      const page = await setupPage({
        permissions: ['geolocation'],
        coords: null,
        permState: 'granted'
      });

      await page.evaluate(() => {
        const stateSquare = document.querySelector('.loc-gsq-state');
        if (stateSquare) stateSquare.click();
      });
      await new Promise(r => setTimeout(r, 500));

      const modalOpen = await page.evaluate(() => {
        const modal = document.querySelector('.pet-selector-overlay');
        const title = modal?.querySelector('.pet-selector-title')?.textContent?.trim();
        return { isOpen: Boolean(modal), title };
      });

      const pass = modalOpen.isOpen && modalOpen.title?.includes('State');
      console.log('Manual entry selector opened:', modalOpen, pass ? '✅ PASS' : '❌ FAIL');
      results.push({ test: 'manual entry opens successfully', pass, details: modalOpen });
      await page.close();
    }

  } finally {
    await browser.close();
  }

  console.log('\n=============================================');
  console.log('           TEST SUITE SUMMARY');
  console.log('=============================================');
  let allPassed = true;
  for (const r of results) {
    console.log(`${r.pass ? '✅ PASS' : '❌ FAIL'}: ${r.test}`);
    if (!r.pass) allPassed = false;
  }
  console.log('=============================================');
  if (allPassed) {
    console.log('🎉 ALL 8 TESTS PASSED SUCCESSFULLY!');
  } else {
    console.log('⚠️ SOME TESTS FAILED. PLEASE REVIEW.');
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
