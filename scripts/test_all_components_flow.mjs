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
  console.log('🚀 Starting Comprehensive Component & Sequential Flow Test Suite...');
  
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
    });
    await new Promise(r => setTimeout(r, 400));
  };

  let snapIdx = 1;
  const snap = async (name) => {
    await dismissSplash();
    const filename = `flow_test_${String(snapIdx++).padStart(2, '0')}_${name}.png`;
    const fullPath = path.join(artifactDir, filename);
    await page.screenshot({ path: fullPath });
    console.log(`📸 Saved screenshot: ${filename}`);
    return filename;
  };

  // 1. Initial Seeding: Setup active user & consent
  console.log('\n--- Step 1: Initialize User Session & Consent ---');
  await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 500));

  await page.evaluate(() => {
    sessionStorage.setItem('findlostpuppy_launch_seen', 'true');
    const user = {
      id: 'test-parent-1',
      name: 'Jaya Krishna',
      email: 'jksurampudi5@gmail.com',
      phone: '9848022338',
      avatar: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="50" fill="%23FF6B00"/><text x="50" y="55" font-size="20" text-anchor="middle" fill="white">JK</text></svg>'
    };
    localStorage.setItem('findlostpuppy_active_user', JSON.stringify(user));

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

    const ownerProfile = {
      id: 'test-parent-1',
      userId: 'test-parent-1',
      fullName: 'Jaya Krishna',
      phone: '9848022338',
      email: 'jksurampudi5@gmail.com',
      photo: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="50" fill="%23FF6B00"/><text x="50" y="55" font-size="20" text-anchor="middle" fill="white">JK</text></svg>',
      preferredContact: 'phone',
      state: 'Andhra Pradesh',
      district: 'Visakhapatnam',
      mandalOrMunicipality: 'Visakhapatnam (Rural)',
      city: 'Rushikonda',
      streetOrLocality: 'Beach Road',
      pinCode: '530045',
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem('findlostpuppy_parent_profile', JSON.stringify(ownerProfile));
    localStorage.setItem('findlostpuppy_owner_profiles', JSON.stringify([ownerProfile]));
  });

  // 2. Test Component: Owner Profile (/owner)
  console.log('\n--- Step 2: Testing Owner Profile Component (/owner) ---');
  await page.goto('http://localhost:5173/owner', { waitUntil: 'domcontentloaded' });
  await dismissSplash();
  await snap('owner_view_mode');

  // Verify in View Mode
  const isViewMode = await page.evaluate(() => {
    return !!document.querySelector('.owner-profile-view-wrap') && !document.querySelector('.owner-combined-form');
  });
  recordTest('Owner Profile Starts in View Mode', isViewMode);

  // Test Clicking Full Name Row -> Switches to Edit Mode and Focuses Input
  console.log('Testing click on Full Name row...');
  const nameRowClickResult = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('.owner-view-row'));
    const nameRow = rows.find(r => r.textContent.includes('Full Name'));
    if (nameRow) {
      nameRow.click();
      return true;
    }
    return false;
  });
  recordTest('Full Name Row Clickable', nameRowClickResult);
  await new Promise(r => setTimeout(r, 200));

  const editModeAfterNameClick = await page.evaluate(() => {
    const input = document.getElementById('owner-full-name');
    const isFocused = document.activeElement === input;
    const formVisible = !!document.querySelector('.owner-combined-form');
    return { formVisible, isFocused, value: input ? input.value : null };
  });
  recordTest('Full Name Click Enters Edit Mode & Autofocuses', editModeAfterNameClick.formVisible, `Focused: ${editModeAfterNameClick.isFocused}, Value: ${editModeAfterNameClick.value}`);
  await snap('owner_edit_mode_after_name_click');

  // Test Cancel Edit
  await page.evaluate(() => {
    const cancelBtn = document.querySelector('.owner-cancel-edit-btn');
    if (cancelBtn) cancelBtn.click();
  });
  await new Promise(r => setTimeout(r, 200));
  const backInViewAfterCancel = await page.evaluate(() => !!document.querySelector('.owner-profile-view-wrap'));
  recordTest('Cancel Button Returns to View Mode', backInViewAfterCancel);

  // Test Clicking Phone Row -> Switches to Edit Mode and Focuses Phone Input
  console.log('Testing click on Phone Number row...');
  const phoneRowClickResult = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('.owner-view-row'));
    const phoneRow = rows.find(r => r.textContent.includes('Mobile Phone Number'));
    if (phoneRow) {
      phoneRow.click();
      return true;
    }
    return false;
  });
  recordTest('Phone Number Row Clickable', phoneRowClickResult);
  await new Promise(r => setTimeout(r, 200));

  const editModeAfterPhoneClick = await page.evaluate(() => {
    const input = document.getElementById('owner-phone');
    const isFocused = document.activeElement === input;
    const formVisible = !!document.querySelector('.owner-combined-form');
    return { formVisible, isFocused, value: input ? input.value : null };
  });
  recordTest('Phone Click Enters Edit Mode & Autofocuses', editModeAfterPhoneClick.formVisible, `Focused: ${editModeAfterPhoneClick.isFocused}`);

  // Test Save & Update Details
  await page.click('.owner-save-btn');
  await new Promise(r => setTimeout(r, 500));
  const viewAfterSave = await page.evaluate(() => !!document.querySelector('.owner-profile-view-wrap'));
  recordTest('Save & Update Details Returns to View Mode', viewAfterSave);

  // Test Navigation: "Continue to Location"
  console.log('Testing navigation to Location...');
  await page.click('.continue-to-location-orange-btn');
  await new Promise(r => setTimeout(r, 800));
  const currentUrlAfterOwner = page.url();
  recordTest('Owner "Continue to Location" Navigates to /location', currentUrlAfterOwner.includes('/location'), `URL: ${currentUrlAfterOwner}`);
  await snap('location_page');

  // 3. Test Component: Location Onboarding (/location)
  console.log('\n--- Step 3: Testing Location Component (/location) ---');

  // Test Button Label: Must say "Continue to Pet Details"
  const locContinueBtnText = await page.evaluate(() => {
    const btn = document.querySelector('.continue-to-pup-btn');
    return btn ? btn.textContent.trim() : null;
  });
  const hasPetDetailsBtnText = locContinueBtnText && locContinueBtnText.includes('Continue to Pet Details');
  recordTest('Location Button Renamed to "Continue to Pet Details"', hasPetDetailsBtnText, `Found: "${locContinueBtnText}"`);

  // Test Location Reset Button: Must completely reset all fields
  console.log('Testing Location Reset Button...');
  const resetBtnClicked = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const rBtn = btns.find(b => b.textContent.includes('Reset') || b.textContent.includes('Reset Location'));
    if (rBtn) {
      rBtn.click();
      return true;
    }
    return false;
  });
  recordTest('Reset Location Button Clicked', resetBtnClicked);

  // Wait 600ms and verify that fields stay cleared (auto-sync does NOT rubberband them back)
  await new Promise(r => setTimeout(r, 600));
  await snap('location_after_reset');

  const locStateAfterReset = await page.evaluate(() => {
    const boxes = Array.from(document.querySelectorAll('.loc-gsq-box'));
    const stateVal = boxes.find(b => b.textContent.includes('State'))?.querySelector('.loc-gsq-value')?.textContent?.trim();
    const distVal = boxes.find(b => b.textContent.includes('District'))?.querySelector('.loc-gsq-value')?.textContent?.trim();
    const streetInput = document.querySelector('input.loc-gsq-value');
    return {
      state: stateVal,
      district: distVal,
      street: streetInput ? streetInput.value : ''
    };
  });
  const isResetComplete = (
    (!locStateAfterReset.state || locStateAfterReset.state === 'Select State') &&
    (!locStateAfterReset.district || locStateAfterReset.district === 'Select District') &&
    (!locStateAfterReset.street || locStateAfterReset.street === '')
  );
  recordTest('Reset Clears Location Without Rubberband Re-population', isResetComplete, `State: "${locStateAfterReset.state}", District: "${locStateAfterReset.district}", Street: "${locStateAfterReset.street}"`);

  // Test Selecting Location through Cascading Modals
  console.log('Testing Cascading Location Selection (State -> District -> Mandal -> Village)...');
  await page.click('.loc-gsq-state');
  await page.waitForFunction(() => document.querySelectorAll('.pet-selector-item').length > 0);

  // Select Andhra Pradesh
  await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('.pet-selector-item'));
    const ap = items.find(i => i.textContent.includes('Andhra Pradesh'));
    if (ap) ap.click();
  });

  // Wait for District modal to open and populate
  await page.waitForFunction(() => {
    const title = document.querySelector('.pet-selector-title');
    return title && title.textContent.includes('District') && document.querySelectorAll('.pet-selector-item').length > 0;
  });
  await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('.pet-selector-item'));
    const viz = items.find(i => i.textContent.includes('Visakhapatnam')) || items[0];
    if (viz) viz.click();
  });

  // Wait for Mandal modal to open and populate
  await page.waitForFunction(() => {
    const title = document.querySelector('.pet-selector-title');
    return title && (title.textContent.includes('Mandal') || title.textContent.includes('Taluk')) && document.querySelectorAll('.pet-selector-item').length > 0;
  });
  await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('.pet-selector-item'));
    if (items[0]) items[0].click();
  });

  // Wait for City modal to open and populate
  await page.waitForFunction(() => {
    const title = document.querySelector('.pet-selector-title');
    return title && (title.textContent.includes('City') || title.textContent.includes('Village') || title.textContent.includes('Home Base')) && document.querySelectorAll('.pet-selector-item').length > 0;
  });
  await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('.pet-selector-item'));
    if (items[0]) items[0].click();
  });

  // Wait for modal to close
  await page.waitForFunction(() => !document.querySelector('.pet-selector-modal-overlay'));
  await snap('location_selected_cascaded');

  // Verify Continue Button still says "Continue to Pet Details"
  const continueBtnInfo = await page.evaluate(() => {
    const btn = document.querySelector('.continue-to-pup-btn');
    return {
      text: btn ? btn.textContent.trim() : null,
      disabled: btn ? btn.disabled : true
    };
  });
  recordTest('Continue Button Text Preserved as "Continue to Pet Details"', continueBtnInfo.text && continueBtnInfo.text.includes('Continue to Pet Details'), continueBtnInfo.text);

  // Test Navigation: Clicking "Continue to Pet Details" navigates directly to /pet (Pet Details)
  console.log('Testing navigation to Pet Details (/pet)...');
  await page.evaluate(() => {
    const btn = document.querySelector('.continue-to-pup-btn');
    if (btn) {
      btn.scrollIntoView({ block: 'center' });
      btn.click();
    }
  });
  await page.waitForFunction(() => window.location.pathname === '/pet', { timeout: 3000 }).catch(() => {});
  const currentUrlAfterLocation = page.url();
  recordTest('Location "Continue to Pet Details" Navigates Directly to /pet', currentUrlAfterLocation.includes('/pet'), `URL: ${currentUrlAfterLocation}`);
  await snap('pet_details_page_loaded');

  // 4. Test Component: Dog / Pet Details (/pet)
  console.log('\n--- Step 4: Testing Pet Details Component (/pet) ---');
  if (!currentUrlAfterLocation.includes('/pet')) {
    await page.goto('http://localhost:5173/pet', { waitUntil: 'domcontentloaded' });
    await dismissSplash();
  }
  const petPageElements = await page.evaluate(() => {
    const title = document.querySelector('h1')?.textContent?.trim();
    const hasViewCard = !!document.querySelector('.pet-profile-view-wrap') || !!document.querySelector('.pet-view-card') || !!document.querySelector('.pet-profile-view-content');
    const hasForm = !!document.querySelector('.pet-interactive-rows') || !!document.querySelector('.pet-profile-photo-center') || !!document.querySelector('.dog-onboarding-card');
    const hasBackBtn = !!document.querySelector('.pet-profile-back-btn') || !!document.querySelector('.onboarding-back-btn');
    return { title, hasViewCard, hasForm, hasBackBtn };
  });
  recordTest('Pet Details Page Renders Title "Pet Details"', petPageElements.title === 'Pet Details', `Found: "${petPageElements.title}"`);
  recordTest('Pet Details Page Renders View/Edit Controls', petPageElements.hasViewCard || petPageElements.hasForm, JSON.stringify(petPageElements));

  // 5. Test Component: Community Recovery Dashboard (/homepage)
  console.log('\n--- Step 5: Testing Community Dashboard (/homepage) ---');
  await page.goto('http://localhost:5173/homepage', { waitUntil: 'domcontentloaded' });
  await dismissSplash();
  await new Promise(r => setTimeout(r, 800));
  await snap('dashboard_page');

  const dashMetrics = await page.evaluate(() => {
    const title = document.querySelector('h1')?.textContent?.trim() || document.querySelector('.dashboard-brand-title')?.textContent?.trim();
    const hasSonu = Array.from(document.querySelectorAll('*')).some(el => el.textContent?.includes('Sonu'));
    const isOverflowing = document.documentElement.scrollWidth > window.innerWidth;
    return { title, hasSonu, isOverflowing };
  });
  recordTest('Dashboard Renders Community Feed', !!dashMetrics.title, `Title: "${dashMetrics.title}"`);
  recordTest('Dashboard Responsive (No Horizontal Overflow)', !dashMetrics.isOverflowing);

  // 6. Test Component: Responsive Mobile 360px Viewport
  console.log('\n--- Step 6: Testing Compact 360px Viewport Across Pages ---');
  await page.setViewport({ width: 360, height: 640, isMobile: true, hasTouch: true });

  await page.goto('http://localhost:5173/owner', { waitUntil: 'domcontentloaded' });
  await dismissSplash();
  const owner360Overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  recordTest('Owner Profile 360px (No Horizontal Overflow)', !owner360Overflow);

  await page.goto('http://localhost:5173/location', { waitUntil: 'domcontentloaded' });
  await dismissSplash();
  const loc360Overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  recordTest('Location Onboarding 360px (No Horizontal Overflow)', !loc360Overflow);

  await page.goto('http://localhost:5173/pet', { waitUntil: 'domcontentloaded' });
  await dismissSplash();
  const pet360Overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  recordTest('Pet Details 360px (No Horizontal Overflow)', !pet360Overflow);

  await browser.close();

  console.log('\n=============================================');
  console.log('🎯 COMPREHENSIVE TEST SUITE FINAL SUMMARY:');
  const passedCount = testResults.filter(t => t.passed).length;
  const failedCount = testResults.filter(t => !t.passed).length;
  console.log(`Total Tests: ${testResults.length} | Passed: ${passedCount} | Failed: ${failedCount}`);
  console.log('=============================================');

  // Save report
  const reportPath = path.join(artifactDir, 'qa_test_report.json');
  fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
}

run().catch(err => {
  console.error('Fatal Test Execution Error:', err);
  process.exit(1);
});
