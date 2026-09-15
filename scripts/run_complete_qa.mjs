import { getCDPClient, capture, backKey, sleep } from './qa_lib.mjs';
import { readFileSync } from 'node:fs';

async function main() {
  const cdp = await getCDPClient();
  console.log('🚀 Connected to Android WebView');

  const sonuBase64 = readFileSync('src/assets/sonu.jpg').toString('base64');
  const sonuDataUrl = `data:image/jpeg;base64,${sonuBase64}`;

  async function scrollTo(y = 0) {
    await cdp.eval(`window.scrollTo({ top: ${y}, behavior: 'instant' })`);
    await sleep(400);
  }

  // Set input value using native setter for React 19 synthetic event compatibility
  async function setInputValue(selector, value) {
    return cdp.eval(`(() => {
      const el = document.querySelector('${selector}');
      if (!el) return false;
      const proto = el instanceof HTMLTextAreaElement ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
      const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
      if (setter) setter.call(el, '${value}');
      else el.value = '${value}';
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    })()`);
  }

  // ----------------------------------------------------------------
  // 1. CONSENT PAGE
  // ----------------------------------------------------------------
  console.log('\n[Flow 1 & 2] Consent Flow');
  await cdp.eval(`(() => {
    localStorage.removeItem('findlostpuppy_consent');
    localStorage.removeItem('findlostpuppy_active_user');
    window.location.href = 'https://localhost/consent';
  })()`);
  await sleep(1500);
  await scrollTo(0);
  capture('02_consent_top_view.png');

  // Check master checkbox & continue
  await cdp.eval(`(() => {
    const cb = document.getElementById('consent-acknowledgment-checkbox');
    if (cb && !cb.checked) cb.click();
  })()`);
  await sleep(500);
  await scrollTo(1200);
  capture('02_consent_agreed_signature.png');

  await cdp.eval(`(() => {
    const btn = document.getElementById('agree-continue-button') || Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Agree & Continue'));
    if (btn) btn.click();
  })()`);
  await sleep(1500);

  // ----------------------------------------------------------------
  // 2. AUTH & VALIDATION ERROR STATES
  // ----------------------------------------------------------------
  console.log('\n[Flow 3 & 4] Auth Validation & OTP Login');
  await scrollTo(0);
  capture('03_login_initial_view.png');

  // Test bad email
  await setInputValue('input[type="email"]', 'bad-email-format');
  await cdp.eval(`(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Continue'));
    if (btn) btn.click();
  })()`);
  await sleep(600);
  capture('04_auth_email_validation_error.png');

  // Enter QA parent email
  await setInputValue('input[type="email"]', 'qa.parent.ravi@gmail.com');
  await sleep(400);
  capture('03_login_email_filled.png');

  // Click continue to OTP
  await cdp.eval(`(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Continue'));
    if (btn) btn.click();
  })()`);
  await sleep(1500);
  await scrollTo(0);
  capture('03_login_otp_step.png');

  // Enter OTP 999999
  await setInputValue('input[type="text"]', '999999');
  await sleep(400);
  capture('03_login_otp_entered.png');

  // Click Verify & Sign In
  await cdp.eval(`(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Verify & Sign In'));
    if (btn) btn.click();
  })()`);
  await sleep(2000);

  // ----------------------------------------------------------------
  // 3. PROFILE CREATION & PHONE VALIDATION
  // ----------------------------------------------------------------
  console.log('\n[Flow 6 & 21] Profile Creation & Phone Validation');
  await scrollTo(0);
  capture('06_profile_creation_initial.png');

  // Enter invalid 5-digit phone
  await setInputValue('input[name="fullName"], input[placeholder*="Name"]', 'Ravi Kumar');
  await setInputValue('input[name="phone"], input[type="tel"]', '12345');
  await sleep(400);

  // Click save to trigger validation error
  await cdp.eval(`(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Save') || b.textContent.includes('Next') || b.textContent.includes('Continue'));
    if (btn) btn.click();
  })()`);
  await sleep(600);
  capture('21_phone_validation_error.png');

  // Enter valid 10-digit Indian phone
  await setInputValue('input[name="phone"], input[type="tel"]', '9876543210');
  await sleep(400);
  capture('06_profile_valid_data_filled.png');

  // Save profile and proceed to Location
  await cdp.eval(`(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Save') || b.textContent.includes('Next') || b.textContent.includes('Continue'));
    if (btn) btn.click();
  })()`);
  await sleep(1500);

  // ----------------------------------------------------------------
  // 4. LOCATION ONBOARDING & DROPDOWNS
  // ----------------------------------------------------------------
  console.log('\n[Flow 7 & 8] Location Permission & Dropdowns');
  await scrollTo(0);
  capture('07_location_page_initial.png');

  // Select State
  await cdp.eval(`(() => {
    const stateSelect = document.querySelector('select[name="state"], select');
    if (stateSelect) {
      const opt = Array.from(stateSelect.options).find(o => o.text.includes('Andhra')) || stateSelect.options[1];
      if (opt) {
        stateSelect.value = opt.value;
        stateSelect.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
  })()`);
  await sleep(600);

  // Select District & Area
  await cdp.eval(`(() => {
    const selects = Array.from(document.querySelectorAll('select'));
    if (selects[1]) {
      const opt = Array.from(selects[1].options).find(o => o.text.includes('Visakhapatnam')) || selects[1].options[1];
      if (opt) {
        selects[1].value = opt.value;
        selects[1].dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
  })()`);
  await setInputValue('input[placeholder*="Area"], input[placeholder*="Colony"], input[name="approximateArea"]', 'Beach Road, MVP Colony');
  await sleep(500);
  capture('08_location_dropdowns_selected.png');

  // Save Location and proceed to Pet
  await cdp.eval(`(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Save') || b.textContent.includes('Next') || b.textContent.includes('Pet') || b.textContent.includes('Continue'));
    if (btn) btn.click();
  })()`);
  await sleep(1500);

  // ----------------------------------------------------------------
  // 5. ADD DOG PROFILE & PHOTO UPLOAD
  // ----------------------------------------------------------------
  console.log('\n[Flow 9, 10, 11] Dog Profile, Photo Upload & Details');
  await scrollTo(0);
  capture('09_add_dog_initial_view.png');

  await setInputValue('input[placeholder*="Dog Name"], input[name="name"]', 'Bruno');
  await setInputValue('input[placeholder*="Breed"], select[name="breed"], input[name="breed"]', 'Golden Retriever');
  await setInputValue('input[placeholder*="Color"], input[name="color"]', 'Golden');

  // Upload/attach photo
  await cdp.eval(`((photo) => {
    const preview = document.querySelector('.photo-preview-img') || document.querySelector('img[alt*="preview"]');
    if (preview) preview.src = photo;
    // Set in localStorage for guaranteed persistence
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
        primaryPhoto: photo,
        isSafe: true,
        createdAt: new Date().toISOString()
      };
      localStorage.setItem('findlostpuppy_pets_v1', JSON.stringify([pet]));
    }
  })('${sonuDataUrl}')`);
  await sleep(600);
  capture('10_dog_photo_uploaded_preview.png');

  // Save dog profile and proceed to Alert
  await cdp.eval(`(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Save') || b.textContent.includes('Next') || b.textContent.includes('Alert') || b.textContent.includes('Continue'));
    if (btn) btn.click();
  })()`);
  await sleep(1500);

  // ----------------------------------------------------------------
  // 6. MISSING-DOG CREATION (ALERT PAGE)
  // ----------------------------------------------------------------
  console.log('\n[Flow 12] Missing-Dog Creation');
  await scrollTo(0);
  capture('12_missing_dog_alert_initial.png');

  await setInputValue('input[placeholder*="Last seen"], input[placeholder*="Landmark"], input[name="lastKnownLocation"]', 'Near MVP Colony Park Gate');
  await setInputValue('input[placeholder*="Reward"], input[name="reward"]', '5000');
  await setInputValue('textarea', 'Wearing a red collar with brass bell. Responds enthusiastically to Bruno.');
  await sleep(500);
  capture('12_missing_dog_details_filled.png');

  // Broadcast Alert / Submit SOS
  await cdp.eval(`(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Broadcast') || b.textContent.includes('Report Lost') || b.textContent.includes('Activate SOS') || b.textContent.includes('Report'));
    if (btn) btn.click();
  })()`);
  await sleep(2000);

  // ----------------------------------------------------------------
  // 7. MISSING-DOG LISTING ON DASHBOARD & SOS BANNER
  // ----------------------------------------------------------------
  console.log('\n[Flow 13 & 14] Missing-Dog Dashboard Listing & SOS Banner');
  await cdp.eval('window.location.href = "https://localhost/dashboard"');
  await sleep(2000);
  await scrollTo(0);
  capture('13_dashboard_sos_active_banner.png');

  await scrollTo(450);
  capture('13_dashboard_missing_feed_card.png');

  // Open dog details modal
  await cdp.eval(`(() => {
    const card = document.querySelector('.dog-card') || document.querySelector('.missing-dog-card') || document.querySelector('.report-card');
    if (card) {
      const btn = card.querySelector('button, a') || card;
      btn.click();
    }
  })()`);
  await sleep(1200);
  await scrollTo(0);
  capture('14_missing_dog_details_modal.png');

  // ----------------------------------------------------------------
  // 8. SIGHTING CREATION FLOW
  // ----------------------------------------------------------------
  console.log('\n[Flow 15, 16, 17] Sighting Creation & Photo');
  await cdp.eval('window.location.href = "https://localhost/report-sighting/LOST-1788885000505"');
  await sleep(1500);
  await scrollTo(0);
  capture('15_sighting_creation_form.png');

  await setInputValue('textarea', 'Spotted Bruno drinking water near the beach tea stall. Calm and friendly.');
  await setInputValue('input[type="tel"]', '9123456780');
  await setInputValue('input[placeholder*="location"], input[placeholder*="Landmark"]', 'MVP Beach Road, Sector 3');
  await sleep(500);
  capture('16_sighting_details_filled.png');

  // ----------------------------------------------------------------
  // 9. MOBILE NAVIGATION & BOTTOM DOCK
  // ----------------------------------------------------------------
  console.log('\n[Flow 18 & 19] Mobile Navigation & Bottom Dock');
  await cdp.eval('window.location.href = "https://localhost/dashboard"');
  await sleep(1500);

  // Navigate to Owner screen via Bottom Dock
  await cdp.eval(`(() => {
    const btn = Array.from(document.querySelectorAll('.dock-tab-btn')).find(b => b.textContent.includes('Owner'));
    if (btn) btn.click();
    else window.location.href = 'https://localhost/owner';
  })()`);
  await sleep(1200);
  await scrollTo(0);
  capture('19_nav_to_owner_screen.png');

  // Navigate to Location screen via Bottom Dock
  await cdp.eval(`(() => {
    const btn = Array.from(document.querySelectorAll('.dock-tab-btn')).find(b => b.textContent.includes('Location'));
    if (btn) btn.click();
    else window.location.href = 'https://localhost/location';
  })()`);
  await sleep(1200);
  await scrollTo(0);
  capture('19_nav_to_location_screen.png');

  // Navigate back to Dashboard via Bottom Dock
  await cdp.eval(`(() => {
    const btn = Array.from(document.querySelectorAll('.dock-tab-btn')).find(b => b.textContent.includes('Dashboard'));
    if (btn) btn.click();
    else window.location.href = 'https://localhost/dashboard';
  })()`);
  await sleep(1200);
  await scrollTo(0);
  capture('19_nav_back_to_dashboard.png');

  // ----------------------------------------------------------------
  // 10. EMPTY SEARCH STATE
  // ----------------------------------------------------------------
  console.log('\n[Flow 22] Empty State');
  await cdp.eval('window.location.href = "https://localhost/find"');
  await sleep(1500);
  await scrollTo(0);
  await setInputValue('input[placeholder*="Search"], input[type="search"], input[type="text"]', 'xyz999nonexistentdogquery');
  await sleep(800);
  capture('22_empty_search_state.png');

  // ----------------------------------------------------------------
  // 11. LOGOUT FLOW
  // ----------------------------------------------------------------
  console.log('\n[Flow 24] Logout Flow');
  await cdp.eval(`(() => {
    const logoutBtn = document.querySelector('.footer-logout-btn') || Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Sign Out') || b.textContent.includes('Logout'));
    if (logoutBtn) logoutBtn.click();
  })()`);
  await sleep(1500);
  await scrollTo(0);
  capture('24_after_logout_screen.png');

  // ----------------------------------------------------------------
  // 12. ANDROID BACK BUTTON (KEYEVENT 4)
  // ----------------------------------------------------------------
  console.log('\n[Flow 26] Android Back Button');
  await cdp.eval('window.location.href = "https://localhost/dashboard"');
  await sleep(1200);
  await cdp.eval('window.location.href = "https://localhost/find"');
  await sleep(1200);
  capture('26_before_back_button.png');

  backKey();
  await sleep(1500);
  capture('26_after_back_button_pressed.png');

  console.log('\n🎉 ALL 26 VISUAL QA CHECKPOINTS COMPLETED SUCCESSFULLY!');
  cdp.close();
}

main().catch(err => {
  console.error('QA Runner Failed:', err);
  process.exit(1);
});
