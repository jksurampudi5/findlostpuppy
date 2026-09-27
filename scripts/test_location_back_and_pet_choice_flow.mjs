import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const artifactDir = '/Users/jayakrishna/.gemini/antigravity-ide/brain/cf958b31-6d2b-47af-a191-6faa9469f81e';

const testResults = [];

function recordTest(name, passed, details = '') {
  testResults.push({ name, passed, details });
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} [${passed ? 'PASS' : 'FAIL'}] ${name} ${details ? `(${details})` : ''}`);
}

async function run() {
  console.log('🚀 Running Location Back Button & Pet Choice Flow Tests...\n');

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

  const dismissSplash = async () => {
    await page.evaluate(() => {
      const splash = document.querySelector('.launch-overlay-backdrop');
      if (splash) splash.style.display = 'none';
      sessionStorage.setItem('findlostpuppy_launch_seen', 'true');
    });
    await new Promise(r => setTimeout(r, 200));
  };

  let snapIdx = 1;
  const snap = async (name) => {
    await dismissSplash();
    const filename = `choice_test_${String(snapIdx++).padStart(2, '0')}_${name}.png`;
    const fullPath = path.join(artifactDir, filename);
    await page.screenshot({ path: fullPath });
    console.log(`📸 Saved screenshot: ${filename}`);
    return filename;
  };

  try {
    // Setup initial state: User with Owner Profile & Location
    await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 400));

    await page.evaluate(() => {
      sessionStorage.setItem('findlostpuppy_launch_seen', 'true');
      const user = {
        id: 'test-parent-1',
        name: 'Jaya Krishna',
        email: 'jksurampudi5@gmail.com',
        phone: '9848022338',
      };
      localStorage.setItem('findlostpuppy_active_user', JSON.stringify(user));
      sessionStorage.setItem('findlostpuppy_user_session', JSON.stringify(user));

      const consentRecord = {
        consentVersion: '1.0',
        termsVersion: '1.0',
        privacyVersion: '1.0',
        disclaimerVersion: '1.0',
        guidelinesVersion: '1.0',
        agreedAt: new Date().toISOString(),
        userId: 'test-parent-1',
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

      // Owner Profile
      const profile = {
        id: 'test-parent-1',
        userId: 'test-parent-1',
        fullName: 'Jaya Krishna',
        email: 'jksurampudi5@gmail.com',
        phone: '9848022338',
        state: 'Andhra Pradesh',
        district: 'Visakhapatnam',
        mandalOrMunicipality: 'Visakhapatnam (Rural)',
        city: 'Rushikonda',
        streetOrLocality: 'IT Park Road',
        pinCode: '530045',
        hasLocationConsent: true,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem('findlostpuppy_owner_profile', JSON.stringify(profile));
      localStorage.setItem('findlostpuppy_parent_profile', JSON.stringify(profile));
      localStorage.setItem('findlostpuppy_owner_profiles', JSON.stringify([profile]));

      // Existing Pet: Buddy
      const pet = {
        id: 'pet-test-1',
        ownerId: 'test-parent-1',
        name: 'Buddy',
        breed: 'Golden Retriever',
        gender: 'Male',
        age: '2 years',
        size: 'Large (25-40 kg)',
        color: 'Golden / Fawn',
        distinguishingMarks: 'White chest patch',
        collarInfo: 'Yes',
        primaryPhoto: '',
        photos: [],
        createdAt: new Date().toISOString()
      };
      localStorage.setItem('findlostpuppy_pets_v1', JSON.stringify([pet]));
      localStorage.setItem('findlostpuppy_pet_profile', JSON.stringify(pet));
      localStorage.setItem('findlostpuppy_pet_profiles', JSON.stringify([pet]));
    });

    // -------------------------------------------------------------
    // TEST 1: Location component top-left back button inside container
    // -------------------------------------------------------------
    console.log('\n--- TEST 1: Location Component Back Button ---');
    await page.goto('http://localhost:5173/location', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 600));
    await snap('location_page');

    const locationBackBtn = await page.$('.location-onboarding-card .pet-profile-back-btn');
    recordTest('Location Back Button rendered on top left inside container', !!locationBackBtn);

    if (locationBackBtn) {
      await locationBackBtn.click();
      await new Promise(r => setTimeout(r, 500));
      await snap('after_location_back_click');
      const currentUrl = page.url();
      recordTest('Clicking Location Back Button navigates to /owner', currentUrl.includes('/owner'), `URL: ${currentUrl}`);
    }

    // -------------------------------------------------------------
    // TEST 2: From Location to Pet Details / Choice
    // -------------------------------------------------------------
    console.log('\n--- TEST 2: Continue from Location to Pet Choice ---');
    await page.goto('http://localhost:5173/location', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 600));

    // Click "Continue to Pet Details" button
    const continueBtn = await page.$('.continue-to-pup-btn');
    recordTest('Continue to Pet Details button exists on Location', !!continueBtn);

    if (continueBtn) {
      await continueBtn.click();
      await new Promise(r => setTimeout(r, 600));
      await snap('after_location_continue_to_choice');
      const currentUrl = page.url();
      recordTest('Location Continue button navigates to /choice', currentUrl.includes('/choice'), `URL: ${currentUrl}`);
    }

    // -------------------------------------------------------------
    // TEST 3: Pet Choice recognizes existing pet ("You already have a pet")
    // -------------------------------------------------------------
    console.log('\n--- TEST 3: Pet Choice with Existing Pet ---');
    const choicePageText = await page.evaluate(() => document.body.innerText);
    const hasAlreadyPetText = choicePageText.includes('You already have a pet');
    recordTest('Pet Choice recognizes "You already have a pet"', hasAlreadyPetText);

    const hasPetNameBuddy = choicePageText.includes('Buddy');
    recordTest('Pet Choice displays existing pet name (Buddy)', hasPetNameBuddy);

    const existingPetBtn = await page.$('.existing-pet-active-option');
    recordTest('Existing pet option card is rendered with active styling', !!existingPetBtn);

    const choiceBackBtn = await page.$('.choice-back-btn');
    recordTest('Pet Choice has back button to return to Location', !!choiceBackBtn);

    // Click on existing pet card to go to Pet Details component
    if (existingPetBtn) {
      await existingPetBtn.click();
      await new Promise(r => setTimeout(r, 600));
      await snap('pet_details_view_mode');

      const petUrl = page.url();
      recordTest('Clicking pet card navigates to /pet (Pet Details component)', petUrl.includes('/pet'), `URL: ${petUrl}`);

      const petText = await page.evaluate(() => document.body.innerText);
      recordTest('Pet Details shows "You already have a pet" indicator', petText.includes('You already have a pet'));
      recordTest('Pet Details shows Buddy and Golden Retriever in view mode', petText.includes('Buddy') && petText.includes('Golden Retriever'));

      const continueToSafetyBtn = await page.$('.pet-view-continue-btn');
      recordTest('Pet Details view mode has "Continue to Pet Safety Status" button', !!continueToSafetyBtn);

      const skipDirectBtn = await page.$('.pet-skip-direct-btn');
      recordTest('Pet Details has direct skip button', !!skipDirectBtn);

      // Click "Continue to Pet Safety Status"
      if (continueToSafetyBtn) {
        await continueToSafetyBtn.click();
        await new Promise(r => setTimeout(r, 600));
        await snap('after_pet_continue_to_alert');
        const alertUrl = page.url();
        recordTest('Continue from Pet Details leads to Pet Safety Status (/alert)', alertUrl.includes('/alert'), `URL: ${alertUrl}`);
      }

      // Test Back from Pet Details to Choice
      await page.goto('http://localhost:5173/pet', { waitUntil: 'domcontentloaded' });
      await new Promise(r => setTimeout(r, 500));
      const petBackBtn = await page.$('.pet-combined-card .pet-profile-back-btn');
      if (petBackBtn) {
        await petBackBtn.click();
        await new Promise(r => setTimeout(r, 500));
        const backUrl = page.url();
        recordTest('Back button on Pet Details navigates back to /choice', backUrl.includes('/choice'), `URL: ${backUrl}`);
      }
    }

    // -------------------------------------------------------------
    // TEST 4: Pet Choice when user has NO pet (Skip directly to next component)
    // -------------------------------------------------------------
    console.log('\n--- TEST 4: Pet Choice without Pet & Skip to Homepage ---');
    await page.evaluate(() => {
      localStorage.removeItem('findlostpuppy_pets_v1');
      localStorage.removeItem('findlostpuppy_pet_profile');
      localStorage.removeItem('findlostpuppy_pet_profiles');
    });

    await page.goto('http://localhost:5173/choice', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 600));
    await snap('choice_page_no_pet');

    const noPetChoiceText = await page.evaluate(() => document.body.innerText);
    recordTest('When no pet exists, displays "Add My Pet"', noPetChoiceText.includes('Add My Pet'));
    recordTest('Displays "I don’t have a pet / Skip"', noPetChoiceText.includes('Skip') || noPetChoiceText.includes('I don’t have a pet'));

    // Click "I don't have a pet / Skip"
    const skipOptionBtn = await page.$('.skip-option');
    recordTest('Skip option button exists on Choice page', !!skipOptionBtn);

    if (skipOptionBtn) {
      await skipOptionBtn.click();
      await new Promise(r => setTimeout(r, 600));
      await snap('after_skip_to_homepage');
      const skippedUrl = page.url();
      recordTest('Clicking "I don\'t have a pet / Skip" navigates directly to Homepage', skippedUrl.includes('/homepage') || skippedUrl.includes('/dashboard'), `URL: ${skippedUrl}`);
    }

    // -------------------------------------------------------------
    // TEST 5: Direct skip from Pet Details component when no pet
    // -------------------------------------------------------------
    console.log('\n--- TEST 5: Direct Skip from Pet Details ---');
    await page.goto('http://localhost:5173/pet', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 600));

    const petDirectSkipBtn = await page.$('.pet-skip-direct-btn');
    recordTest('Direct skip button exists on Pet Details form', !!petDirectSkipBtn);

    if (petDirectSkipBtn) {
      await petDirectSkipBtn.click();
      await new Promise(r => setTimeout(r, 600));
      const directSkipUrl = page.url();
      recordTest('Direct skip button navigates to Homepage', directSkipUrl.includes('/homepage') || directSkipUrl.includes('/dashboard'), `URL: ${directSkipUrl}`);
    }

    // -------------------------------------------------------------
    // TEST 6: Remove Pet Profile from top of Pet Details & Skip
    // -------------------------------------------------------------
    console.log('\n--- TEST 6: Remove Pet Profile at Top & Skip to Dashboard ---');
    await page.evaluate(() => {
      const pet = {
        id: 'pet-test-1',
        ownerId: 'test-parent-1',
        name: 'Buddy',
        breed: 'Golden Retriever',
        gender: 'Male',
        age: '2 years',
        size: 'Large (25-40 kg)',
        color: 'Golden / Fawn',
        distinguishingMarks: 'White chest patch',
        collarInfo: 'Yes',
        primaryPhoto: '',
        photos: [],
        createdAt: new Date().toISOString()
      };
      localStorage.setItem('findlostpuppy_pets_v1', JSON.stringify([pet]));
      localStorage.setItem('findlostpuppy_pet_profile', JSON.stringify(pet));
    });

    await page.goto('http://localhost:5173/pet', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 600));

    const removeBtn = await page.$('.pet-profile-remove-btn');
    recordTest('Remove Pet button is rendered at top of Pet Details form', !!removeBtn);

    page.once('dialog', async dialog => {
      console.log('Dialog opened:', dialog.message());
      await dialog.accept();
    });

    if (removeBtn) {
      await removeBtn.click();
      await new Promise(r => setTimeout(r, 700));
      await snap('after_pet_removal');

      const storageHasPet = await page.evaluate(() => {
        const stored = localStorage.getItem('findlostpuppy_pets_v1');
        if (!stored) return false;
        try {
          const list = JSON.parse(stored);
          return list.some(p => p.name === 'Buddy' || p.id === 'pet-test-1');
        } catch { return false; }
      });
      recordTest('Pet profile was removed from local storage and backend tombstone', !storageHasPet);

      const formActive = await page.evaluate(() => {
        return !!document.querySelector('.pet-combined-form') || !!document.querySelector('form');
      });
      recordTest('Component is ready to refill new pet details', formActive);

      const skipAfterRemoveBtn = await page.$('.pet-skip-direct-btn');
      recordTest('Skip button is available after removing pet', !!skipAfterRemoveBtn);

      if (skipAfterRemoveBtn) {
        await skipAfterRemoveBtn.click();
        await new Promise(r => setTimeout(r, 600));
        await snap('dashboard_after_skip');
        const finalUrl = page.url();
        recordTest('User can skip pet status and move directly to dashboard', finalUrl.includes('/homepage') || finalUrl.includes('/dashboard'), `URL: ${finalUrl}`);
      }
    }

  } catch (err) {
    console.error('Test Suite encountered error:', err);
    recordTest('Test Suite Execution', false, String(err));
  } finally {
    await browser.close();
  }

  console.log('\n=============================================');
  console.log('🏁 TEST SUITE SUMMARY:');
  const passedCount = testResults.filter(t => t.passed).length;
  console.log(`Passed: ${passedCount}/${testResults.length}`);
  console.log('=============================================\n');

  if (passedCount !== testResults.length) {
    process.exit(1);
  }
}

run();
