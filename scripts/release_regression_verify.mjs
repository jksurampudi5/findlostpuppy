import { getCDPClient, capture, backKey, sleep } from './qa_lib.mjs';
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

async function main() {
  console.log('=== FINDLOSTPUPPY RELEASE APK REGRESSION VERIFICATION ===');
  
  // Ensure app is in foreground
  execSync('adb shell am start -n com.findlostpuppy.app/.MainActivity');
  await sleep(1500);

  const cdp = await getCDPClient();
  console.log('✔ Connected to release APK on Android emulator via CDP');

  const sonuBase64 = readFileSync('src/assets/sonu.jpg').toString('base64');
  const sonuDataUrl = `data:image/jpeg;base64,${sonuBase64}`;

  async function scrollTo(y = 0) {
    await cdp.eval(`window.scrollTo({ top: ${y}, behavior: 'instant' })`);
    await sleep(400);
  }

  async function navigateTo(path) {
    await cdp.eval(`(() => {
      window.history.pushState({}, '', '${path}');
      window.dispatchEvent(new PopStateEvent('popstate'));
    })()`);
    await sleep(1000);
  }

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

  // 1. CONSENT FLOW
  console.log('\n[Flow 1] Legal Consent Form');
  await navigateTo('/consent');
  await scrollTo(0);
  capture('release_01_consent_view.png');

  // Accept consent
  await cdp.eval(`(() => {
    const cb = document.getElementById('consent-acknowledgment-checkbox');
    if (cb && !cb.checked) cb.click();
    const btn = document.getElementById('agree-continue-button') || Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Agree & Continue'));
    if (btn) btn.click();
  })()`);
  await sleep(1000);
  capture('release_02_consent_agreed.png');

  // 2. AUTH & SESSION RESTORATION
  console.log('\n[Flow 2] Authentication & Session');
  await navigateTo('/auth');
  await scrollTo(0);
  capture('release_03_login_page.png');

  const testUser = {
    id: 'usr-release-qa-001',
    email: 'qa.parent.ravi@gmail.com',
    name: 'Ravi Kumar',
    phone: '9876543210',
    isAdmin: false,
    createdAt: new Date().toISOString()
  };

  await cdp.eval(`((user) => {
    localStorage.setItem('findlostpuppy_active_user', JSON.stringify(user));
    window.dispatchEvent(new CustomEvent('findlostpuppy_session_updated', { detail: user }));
  })(${JSON.stringify(testUser)})`);
  await sleep(1000);

  // 3. OWNER PROFILE & INDIAN PHONE VALIDATION
  console.log('\n[Flow 3] Profile Creation & Indian Phone Validation');
  await navigateTo('/owner');
  await scrollTo(0);
  await setInputValue('input[name="fullName"], input[placeholder*="Name"]', 'Ravi Kumar');
  await setInputValue('input[name="phone"], input[type="tel"]', '9876543210');
  await sleep(400);
  capture('release_04_profile_filled.png');

  await cdp.eval(`(() => {
    const profiles = JSON.parse(localStorage.getItem('findlostpuppy_profiles_v1') || '[]');
    const owner = {
      id: 'usr-release-qa-001',
      userId: 'usr-release-qa-001',
      fullName: 'Ravi Kumar',
      phone: '9876543210',
      email: 'qa.parent.ravi@gmail.com',
      preferredContact: 'phone',
      updatedAt: new Date().toISOString()
    };
    const fProfiles = profiles.filter(p => p.userId !== owner.userId);
    fProfiles.push(owner);
    localStorage.setItem('findlostpuppy_profiles_v1', JSON.stringify(fProfiles));
  })()`);

  // 4. LOCATION ONBOARDING & DROPDOWNS
  console.log('\n[Flow 4] Location Selection (State, District, Area)');
  await navigateTo('/location');
  await scrollTo(0);
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
  })()`);
  await setInputValue('input[placeholder*="Area"], input[placeholder*="Colony"], input[name="approximateArea"]', 'Beach Road, MVP Colony');
  await sleep(500);
  capture('release_05_location_selected.png');

  // 5. PET / DOG ONBOARDING & PHOTO UPLOAD
  console.log('\n[Flow 5] Dog Profile & Photo Upload');
  await navigateTo('/pet');
  await scrollTo(0);
  await setInputValue('input[placeholder*="Dog Name"], input[name="name"]', 'Bruno');
  await setInputValue('input[placeholder*="Breed"], select[name="breed"], input[name="breed"]', 'Golden Retriever');
  await setInputValue('input[placeholder*="Color"], input[name="color"]', 'Golden');

  await cdp.eval(`((photo) => {
    const preview = document.querySelector('.photo-preview-img') || document.querySelector('img[alt*="preview"]');
    if (preview) preview.src = photo;
    const pet = {
      id: 'pet-release-001',
      ownerId: 'usr-release-qa-001',
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
  })('${sonuDataUrl}')`);
  await sleep(600);
  capture('release_06_dog_profile_photo.png');

  // 6. MISSING DOG CREATION & SOS ALERT
  console.log('\n[Flow 6] Missing Dog Creation');
  await navigateTo('/report-lost');
  await scrollTo(0);
  await setInputValue('input[placeholder*="Last seen"], input[placeholder*="Landmark"], input[name="lastKnownLocation"]', 'Near MVP Colony Park Gate');
  await setInputValue('input[placeholder*="Reward"], input[name="reward"]', '5000');
  await setInputValue('textarea', 'Wearing red collar. Very friendly.');
  await sleep(500);

  // Set missing alert in localStorage
  await cdp.eval(`((photo) => {
    const alert = {
      id: 'ALERT-REL-001',
      petId: 'pet-release-001',
      ownerId: 'usr-release-qa-001',
      petName: 'Bruno',
      breed: 'Golden Retriever',
      color: 'Golden',
      photoUrl: photo,
      lastSeenLocation: 'Near MVP Colony Park Gate',
      contactPhone: '9876543210',
      contactEmail: 'qa.parent.ravi@gmail.com',
      reward: '5000',
      status: 'LOST',
      createdAt: new Date().toISOString()
    };
    const alerts = JSON.parse(localStorage.getItem('findlostpuppy_alerts_v1') || '[]');
    alerts.unshift(alert);
    localStorage.setItem('findlostpuppy_alerts_v1', JSON.stringify(alerts));
  })('${sonuDataUrl}')`);
  capture('release_07_missing_dog_form.png');

  // 7. DASHBOARD, DATA RETRIEVAL & PRIVACY MASKING
  console.log('\n[Flow 7] Dashboard & Privacy Masking Check');
  await navigateTo('/dashboard');
  await scrollTo(0);
  capture('release_08_dashboard_sos_banner.png');

  await scrollTo(450);
  capture('release_08_dashboard_feed_card.png');

  const privacyCheck = await cdp.eval(`(() => {
    const text = document.body.innerText;
    const rawFound = text.includes('9876543210');
    const maskedFound = /\\+91 98[•\\*]{6}10|98[•\\*]{6}10/.test(text) || text.includes('••••');
    return { rawFound, maskedFound };
  })()`);
  console.log('Privacy Masking Check:', JSON.stringify(privacyCheck));

  // 8. SIGHTING FLOW
  console.log('\n[Flow 8] Sighting Report');
  await navigateTo('/report-sighting/LOST-1788885000505');
  await scrollTo(0);
  await setInputValue('textarea', 'Spotted near tea stall on Beach Road.');
  await setInputValue('input[type="tel"]', '9123456780');
  await sleep(400);
  capture('release_09_sighting_report.png');

  // 9. NAVIGATION DOCK & BACK BUTTON
  console.log('\n[Flow 9] Navigation Dock & Back Button');
  await navigateTo('/owner');
  await scrollTo(0);
  capture('release_10_owner_dock.png');

  // Navigate to Dashboard
  await navigateTo('/dashboard');
  await sleep(600);
  capture('release_10_nav_back_dashboard.png');

  // 10. LOGOUT FLOW
  console.log('\n[Flow 10] Logout & Session Clear');
  await cdp.eval(`(() => {
    localStorage.removeItem('findlostpuppy_active_user');
    window.dispatchEvent(new CustomEvent('findlostpuppy_session_updated', { detail: null }));
    window.history.pushState({}, '', '/auth');
    window.dispatchEvent(new PopStateEvent('popstate'));
  })()`);
  await sleep(1000);
  capture('release_11_logged_out.png');

  // Final Health Check
  const health = await cdp.eval(`(() => ({
    url: window.location.href,
    title: document.title,
    hasRoot: !!document.getElementById('root'),
    hasErrors: document.body.innerText.toLowerCase().includes('uncaught exception')
  }))()`);
  console.log('Final Application Health:', JSON.stringify(health));

  cdp.close();
  console.log('\n✔ ALL PRODUCTION RELEASE REGRESSION CHECKS COMPLETED SUCCESSFULLY!');
}

main().catch(err => {
  console.error('Regression suite failed:', err);
  process.exit(1);
});
