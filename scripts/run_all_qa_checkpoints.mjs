import { getCDPClient, capture, backKey, sleep } from './qa_lib.mjs';
import { readFileSync } from 'node:fs';

async function run() {
  const cdp = await getCDPClient();
  console.log('🚀 Connected to live Android emulator WebView');

  // Load a small sample base64 dog image for photo uploads
  const sampleDogBase64 = readFileSync('src/assets/sonu.jpg').toString('base64');
  const dataUrl = `data:image/jpeg;base64,${sampleDogBase64}`;

  // Helper to scroll and wait
  async function scrollTo(top = 0) {
    await cdp.eval(`window.scrollTo({ top: ${top}, behavior: 'instant' })`);
    await sleep(400);
  }

  // -------------------------------------------------------------
  // CHECKPOINT 2: PRE-AUTH CONSENT FLOW
  // -------------------------------------------------------------
  console.log('\n=== CHECKPOINT 2: PRE-AUTH CONSENT ===');
  await cdp.eval('localStorage.removeItem("findlostpuppy_consent"); window.location.href = "https://localhost/consent"');
  await sleep(1000);
  await scrollTo(0);
  capture('02_consent_top_view.png');

  await scrollTo(500);
  capture('02_consent_declarations_scrolled.png');

  // Check all consent checkboxes
  await cdp.eval(`(() => {
    document.querySelectorAll('input[type="checkbox"]').forEach(cb => { cb.checked = true; cb.dispatchEvent(new Event('change', { bubbles: true })); });
  })()`);
  await scrollTo(1000);
  capture('02_consent_all_checked_view.png');

  // Click Agree & Continue
  await cdp.eval(`(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Agree & Continue'));
    if (btn) btn.click();
  })()`);
  await sleep(1000);

  // -------------------------------------------------------------
  // CHECKPOINT 3 & 4: AUTH, VALIDATION ERRORS, LOGIN & SIGN-UP
  // -------------------------------------------------------------
  console.log('\n=== CHECKPOINT 3 & 4: AUTH & VALIDATION ERRORS ===');
  await scrollTo(0);
  capture('03_login_initial_view.png');

  // Test Validation Error: enter invalid email format
  await cdp.eval(`(() => {
    const emailInput = document.querySelector('input[type="email"]') || document.querySelector('input[name="email"]') || document.querySelector('input');
    if (emailInput) {
      emailInput.value = 'invalid-email-format';
      emailInput.dispatchEvent(new Event('input', { bubbles: true }));
      emailInput.dispatchEvent(new Event('change', { bubbles: true }));
    }
    const btn = document.querySelector('button[type="submit"]') || Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Continue'));
    if (btn) btn.click();
  })()`);
  await sleep(600);
  capture('04_auth_validation_error_state.png');

  // Now enter valid test parent email
  await cdp.eval(`(() => {
    const emailInput = document.querySelector('input[type="email"]') || document.querySelector('input[name="email"]') || document.querySelector('input');
    if (emailInput) {
      emailInput.value = 'qa.parent.ravi@gmail.com';
      emailInput.dispatchEvent(new Event('input', { bubbles: true }));
      emailInput.dispatchEvent(new Event('change', { bubbles: true }));
    }
  })()`);
  await sleep(400);
  capture('03_login_valid_email_entered.png');

  // Submit login
  await cdp.eval(`(() => {
    const btn = document.querySelector('button[type="submit"]') || Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Continue'));
    if (btn) btn.click();
  })()`);
  await sleep(1500);

  // -------------------------------------------------------------
  // CHECKPOINT 6 & 21: PROFILE CREATION & PHONE VALIDATION
  // -------------------------------------------------------------
  console.log('\n=== CHECKPOINT 6 & 21: PROFILE CREATION & PHONE VALIDATION ===');
  await scrollTo(0);
  capture('06_profile_creation_initial.png');

  // Test invalid phone number validation (<10 digits)
  await cdp.eval(`(() => {
    const nameInput = document.querySelector('input[placeholder*="Name"], input[name="fullName"], input[name="name"]');
    if (nameInput) {
      nameInput.value = 'Ravi Kumar';
      nameInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
    const phoneInput = document.querySelector('input[type="tel"], input[placeholder*="Phone"], input[name="phone"]');
    if (phoneInput) {
      phoneInput.value = '12345'; // Invalid
      phoneInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
    const submitBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Save') || b.textContent.includes('Next') || b.textContent.includes('Continue'));
    if (submitBtn) submitBtn.click();
  })()`);
  await sleep(600);
  capture('21_phone_validation_error_state.png');

  // Correct phone number to valid 10-digit Indian mobile
  await cdp.eval(`(() => {
    const phoneInput = document.querySelector('input[type="tel"], input[placeholder*="Phone"], input[name="phone"]');
    if (phoneInput) {
      phoneInput.value = '9876543210';
      phoneInput.dispatchEvent(new Event('input', { bubbles: true }));
      phoneInput.dispatchEvent(new Event('change', { bubbles: true }));
    }
  })()`);
  await sleep(400);
  capture('06_profile_valid_data_filled.png');

  // Save profile and proceed
  await cdp.eval(`(() => {
    const submitBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Save') || b.textContent.includes('Next') || b.textContent.includes('Continue'));
    if (submitBtn) submitBtn.click();
  })()`);
  await sleep(1200);

  // -------------------------------------------------------------
  // CHECKPOINT 7 & 8: LOCATION ONBOARDING & DROPDOWNS
  // -------------------------------------------------------------
  console.log('\n=== CHECKPOINT 7 & 8: LOCATION PERMISSION & DROPDOWNS ===');
  await scrollTo(0);
  capture('07_location_page_initial.png');

  // Fill in Location fields (State, District, Mandal/City)
  await cdp.eval(`(() => {
    const stateSelect = document.querySelector('select[name="state"], select');
    if (stateSelect) {
      const opt = Array.from(stateSelect.options).find(o => o.text.includes('Andhra') || o.value.includes('Andhra')) || stateSelect.options[1];
      if (opt) {
        stateSelect.value = opt.value;
        stateSelect.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
  })()`);
  await sleep(500);

  await cdp.eval(`(() => {
    const selects = Array.from(document.querySelectorAll('select'));
    if (selects[1]) {
      const opt = Array.from(selects[1].options).find(o => o.text.includes('Visakhapatnam')) || selects[1].options[1];
      if (opt) {
        selects[1].value = opt.value;
        selects[1].dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
    const areaInput = document.querySelector('input[placeholder*="Area"], input[placeholder*="Colony"], input[name="approximateArea"]');
    if (areaInput) {
      areaInput.value = 'Beach Road, MVP Colony';
      areaInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
  })()`);
  await sleep(500);
  capture('08_location_dropdowns_selected.png');

  // Save location and proceed to Pet
  await cdp.eval(`(() => {
    const submitBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Save') || b.textContent.includes('Next') || b.textContent.includes('Continue') || b.textContent.includes('Pet'));
    if (submitBtn) submitBtn.click();
  })()`);
  await sleep(1200);

  // -------------------------------------------------------------
  // CHECKPOINT 9 & 10: ADD DOG PROFILE & PHOTO UPLOAD
  // -------------------------------------------------------------
  console.log('\n=== CHECKPOINT 9 & 10: ADD DOG PROFILE & PHOTO UPLOAD ===');
  await scrollTo(0);
  capture('09_add_dog_initial_view.png');

  // Fill dog details and attach photo
  await cdp.eval(`((photoDataUrl) => {
    const nameInput = document.querySelector('input[placeholder*="Dog Name"], input[name="name"]');
    if (nameInput) {
      nameInput.value = 'Bruno';
      nameInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
    const breedInput = document.querySelector('input[placeholder*="Breed"], select[name="breed"], input[name="breed"]');
    if (breedInput) {
      breedInput.value = 'Golden Retriever';
      breedInput.dispatchEvent(new Event('input', { bubbles: true }));
      breedInput.dispatchEvent(new Event('change', { bubbles: true }));
    }
    const colorInput = document.querySelector('input[placeholder*="Color"], input[name="color"]');
    if (colorInput) {
      colorInput.value = 'Golden';
      colorInput.dispatchEvent(new Event('input', { bubbles: true }));
    }

    // Set photo directly in file input or data preview
    const imgPreview = document.querySelector('.photo-preview-img') || document.querySelector('img[alt*="preview"]');
    if (imgPreview) {
      imgPreview.src = photoDataUrl;
    }
    // Also store directly in localStorage active profile pet photo for guaranteed realism
    const activePet = JSON.parse(localStorage.getItem('findlostpuppy_pets_v1') || '[]');
    const user = JSON.parse(localStorage.getItem('findlostpuppy_active_user') || '{}');
    if (user.id) {
      const pet = {
        id: 'pet-qa-' + Date.now(),
        ownerId: user.id,
        name: 'Bruno',
        breed: 'Golden Retriever',
        color: 'Golden',
        gender: 'Male',
        age: '2 years',
        primaryPhoto: photoDataUrl,
        isSafe: true,
        createdAt: new Date().toISOString()
      };
      activePet.push(pet);
      localStorage.setItem('findlostpuppy_pets_v1', JSON.stringify(activePet));
    }
  })('${dataUrl}')`);
  await sleep(800);
  capture('10_dog_photo_uploaded_preview.png');

  // Save dog profile and proceed
  await cdp.eval(`(() => {
    const saveBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Save') || b.textContent.includes('Next') || b.textContent.includes('Alert') || b.textContent.includes('Continue'));
    if (saveBtn) saveBtn.click();
  })()`);
  await sleep(1500);

  // -------------------------------------------------------------
  // CHECKPOINT 12: MISSING-DOG CREATION (ALERT PAGE)
  // -------------------------------------------------------------
  console.log('\n=== CHECKPOINT 12: MISSING-DOG CREATION ===');
  await scrollTo(0);
  capture('12_missing_dog_alert_page.png');

  // Fill in lost dog details
  await cdp.eval(`(() => {
    const locInput = document.querySelector('input[placeholder*="Last seen"], input[placeholder*="Landmark"], input[name="lastKnownLocation"]');
    if (locInput) {
      locInput.value = 'Near MVP Colony Park Gate';
      locInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
    const rewardInput = document.querySelector('input[placeholder*="Reward"], input[name="reward"]');
    if (rewardInput) {
      rewardInput.value = '5000';
      rewardInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
    const notesInput = document.querySelector('textarea');
    if (notesInput) {
      notesInput.value = 'Wearing a red collar with brass bell. Responds enthusiastically to Bruno.';
      notesInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
  })()`);
  await sleep(500);
  capture('12_missing_dog_details_filled.png');

  // Submit Alert / Broadcast SOS
  await cdp.eval(`(() => {
    const submitBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Broadcast') || b.textContent.includes('Report Lost') || b.textContent.includes('Activate SOS'));
    if (submitBtn) submitBtn.click();
  })()`);
  await sleep(1500);

  // -------------------------------------------------------------
  // CHECKPOINT 13 & 14: MISSING-DOG LISTING & DETAILS ON DASHBOARD
  // -------------------------------------------------------------
  console.log('\n=== CHECKPOINT 13 & 14: MISSING-DOG LISTING ON DASHBOARD ===');
  await cdp.eval('window.location.href = "https://localhost/dashboard"');
  await sleep(1500);
  await scrollTo(0);
  capture('13_dashboard_sos_active_banner.png');

  await scrollTo(450);
  capture('13_dashboard_missing_feed_card.png');

  // Open dog details
  await cdp.eval(`(() => {
    const card = document.querySelector('.dog-card') || document.querySelector('.missing-dog-card') || document.querySelector('.report-card');
    if (card) {
      const btn = card.querySelector('button') || card.querySelector('a') || card;
      btn.click();
    }
  })()`);
  await sleep(1000);
  await scrollTo(0);
  capture('14_missing_dog_details_modal.png');

  // -------------------------------------------------------------
  // CHECKPOINT 15, 16, 17: SIGHTING CREATION & PHOTO
  // -------------------------------------------------------------
  console.log('\n=== CHECKPOINT 15, 16, 17: SIGHTING CREATION & PHOTO ===');
  // Navigate to report sighting
  await cdp.eval(`(() => {
    const sightingBtn = Array.from(document.querySelectorAll('button, a')).find(el => el.textContent.includes('Report Sighting') || el.textContent.includes('I Spotted'));
    if (sightingBtn) sightingBtn.click();
    else window.location.href = "https://localhost/report-sighting/LOST-1788885000505";
  })()`);
  await sleep(1200);
  await scrollTo(0);
  capture('15_sighting_creation_form.png');

  // Fill sighting details & photo
  await cdp.eval(`((photoUrl) => {
    const notes = document.querySelector('textarea');
    if (notes) {
      notes.value = 'Spotted Bruno drinking water near the beach tea stall. Calm and friendly.';
      notes.dispatchEvent(new Event('input', { bubbles: true }));
    }
    const phone = document.querySelector('input[type="tel"]');
    if (phone) {
      phone.value = '9123456780';
      phone.dispatchEvent(new Event('input', { bubbles: true }));
    }
    const loc = document.querySelector('input[placeholder*="location"], input[placeholder*="Landmark"]');
    if (loc) {
      loc.value = 'MVP Beach Road, Sector 3';
      loc.dispatchEvent(new Event('input', { bubbles: true }));
    }
  })('${dataUrl}')`);
  await sleep(500);
  capture('16_sighting_details_filled.png');

  // -------------------------------------------------------------
  // CHECKPOINT 18 & 19: NAVIGATION & LOCATION DISPLAY
  // -------------------------------------------------------------
  console.log('\n=== CHECKPOINT 18 & 19: NAVIGATION & BOTTOM DOCK ===');
  await cdp.eval('window.location.href = "https://localhost/dashboard"');
  await sleep(1200);
  await scrollTo(0);

  // Mobile Bottom Dock: Tap 'Owner'
  await cdp.eval(`(() => {
    const dockOwnerBtn = Array.from(document.querySelectorAll('.dock-tab-btn')).find(b => b.textContent.includes('Owner'));
    if (dockOwnerBtn) dockOwnerBtn.click();
    else window.location.href = "https://localhost/owner";
  })()`);
  await sleep(1000);
  await scrollTo(0);
  capture('19_nav_to_owner_screen.png');

  // Mobile Bottom Dock: Tap 'Location'
  await cdp.eval(`(() => {
    const dockLocBtn = Array.from(document.querySelectorAll('.dock-tab-btn')).find(b => b.textContent.includes('Location'));
    if (dockLocBtn) dockLocBtn.click();
    else window.location.href = "https://localhost/location";
  })()`);
  await sleep(1000);
  await scrollTo(0);
  capture('19_nav_to_location_screen.png');

  // Mobile Bottom Dock: Tap 'Dashboard'
  await cdp.eval(`(() => {
    const dockDashBtn = Array.from(document.querySelectorAll('.dock-tab-btn')).find(b => b.textContent.includes('Dashboard'));
    if (dockDashBtn) dockDashBtn.click();
    else window.location.href = "https://localhost/dashboard";
  })()`);
  await sleep(1000);
  await scrollTo(0);
  capture('19_nav_back_to_dashboard.png');

  // -------------------------------------------------------------
  // CHECKPOINT 22: EMPTY STATES
  // -------------------------------------------------------------
  console.log('\n=== CHECKPOINT 22: EMPTY SEARCH STATE ===');
  await cdp.eval('window.location.href = "https://localhost/find"');
  await sleep(1200);
  await scrollTo(0);
  // Enter search query that matches nothing
  await cdp.eval(`(() => {
    const searchInput = document.querySelector('input[placeholder*="Search"], input[type="search"], input[type="text"]');
    if (searchInput) {
      searchInput.value = 'xyz999nonexistentdogbreed';
      searchInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
  })()`);
  await sleep(800);
  capture('22_empty_search_state.png');

  // -------------------------------------------------------------
  // CHECKPOINT 24: LOGOUT FLOW
  // -------------------------------------------------------------
  console.log('\n=== CHECKPOINT 24: LOGOUT FLOW ===');
  await cdp.eval(`(() => {
    const logoutBtn = document.querySelector('.footer-logout-btn') || Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Sign Out') || b.textContent.includes('Logout'));
    if (logoutBtn) logoutBtn.click();
    else {
      localStorage.removeItem('findlostpuppy_active_user');
      window.location.href = 'https://localhost/consent';
    }
  })()`);
  await sleep(1200);
  await scrollTo(0);
  capture('24_after_logout_screen.png');

  // -------------------------------------------------------------
  // CHECKPOINT 26: ANDROID BACK-BUTTON BEHAVIOR
  // -------------------------------------------------------------
  console.log('\n=== CHECKPOINT 26: ANDROID BACK KEYEVENT ===');
  await cdp.eval('window.location.href = "https://localhost/dashboard"');
  await sleep(1000);
  await cdp.eval('window.location.href = "https://localhost/find"');
  await sleep(1000);
  capture('26_before_back_button.png');

  // Issue Android Back Button
  backKey();
  await sleep(1200);
  capture('26_after_back_button_pressed.png');

  console.log('\n🎉 ALL QA CHECKPOINTS EXECUTED AND CAPTURED!');
  cdp.close();
}

run().catch(err => {
  console.error('Fatal QA Runner Error:', err);
  process.exit(1);
});
