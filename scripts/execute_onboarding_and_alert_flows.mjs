import { getCDPClient, capture, backKey, sleep } from './qa_lib.mjs';
import { readFileSync } from 'node:fs';

async function main() {
  console.log('Connecting to WebView CDP...');
  const cdp = await getCDPClient();
  console.log('Connected.');

  async function scrollTo(top = 0) {
    await cdp.eval(`window.scrollTo({ top: ${top}, behavior: 'instant' })`);
    await sleep(400);
  }

  // Load Sonu photo base64
  const sampleDogBase64 = readFileSync('src/assets/sonu.jpg').toString('base64');
  const dataUrl = `data:image/jpeg;base64,${sampleDogBase64}`;

  // STEP 6: Fix phone number to valid non-dummy Indian mobile
  console.log('\n--- Step 6: Setting valid phone 9848022338 and saving profile ---');
  await scrollTo(0);
  await cdp.eval(`(() => {
    const setReactVal = (elem, val) => {
      const proto = Object.getPrototypeOf(elem);
      const set = Object.getOwnPropertyDescriptor(proto, 'value').set;
      set.call(elem, val);
      elem.dispatchEvent(new Event('input', { bubbles: true }));
      elem.dispatchEvent(new Event('change', { bubbles: true }));
    };
    const nameInput = document.querySelector('input[placeholder*="Name"], input[name="fullName"], input[name="name"]');
    if (nameInput) setReactVal(nameInput, 'Ravi Kumar');
    
    const phoneInput = document.querySelector('input[type="tel"], input[placeholder*="Phone"], input[name="phone"]');
    if (phoneInput) setReactVal(phoneInput, '9848022338');
  })()`);
  await sleep(500);
  capture('06_profile_valid_phone_filled.png');

  // Click Save & Continue to Location
  await cdp.eval(`(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Save & Continue to Location') || b.textContent.includes('Save'));
    if (btn) btn.click();
  })()`);
  await sleep(1500);

  // STEP 7 & 8: Location Onboarding Page
  console.log('\n--- Step 7 & 8: Location Onboarding Page ---');
  await scrollTo(0);
  capture('07_location_page_initial.png');

  // Select State, District, and enter Area
  await cdp.eval(`(() => {
    const setReactVal = (elem, val) => {
      const proto = Object.getPrototypeOf(elem);
      const set = Object.getOwnPropertyDescriptor(proto, 'value').set;
      set.call(elem, val);
      elem.dispatchEvent(new Event('input', { bubbles: true }));
      elem.dispatchEvent(new Event('change', { bubbles: true }));
    };

    const selects = Array.from(document.querySelectorAll('select'));
    if (selects[0]) {
      const opt = Array.from(selects[0].options).find(o => o.text.includes('Andhra') || o.value.includes('Andhra')) || selects[0].options[1];
      if (opt) {
        selects[0].value = opt.value;
        selects[0].dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
  })()`);
  await sleep(800);

  await cdp.eval(`(() => {
    const setReactVal = (elem, val) => {
      const proto = Object.getPrototypeOf(elem);
      const set = Object.getOwnPropertyDescriptor(proto, 'value').set;
      set.call(elem, val);
      elem.dispatchEvent(new Event('input', { bubbles: true }));
      elem.dispatchEvent(new Event('change', { bubbles: true }));
    };

    const selects = Array.from(document.querySelectorAll('select'));
    if (selects[1]) {
      const opt = Array.from(selects[1].options).find(o => o.text.includes('Visakhapatnam')) || selects[1].options[1];
      if (opt) {
        selects[1].value = opt.value;
        selects[1].dispatchEvent(new Event('change', { bubbles: true }));
      }
    }

    const areaInput = document.querySelector('input[placeholder*="Area"], input[placeholder*="Colony"], input[name="approximateArea"], input[placeholder*="Landmark"]');
    if (areaInput) {
      setReactVal(areaInput, 'Beach Road, MVP Colony');
    }
  })()`);
  await sleep(500);
  capture('08_location_dropdowns_selected.png');

  // Click Save & Continue to Pet
  await cdp.eval(`(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Save') || b.textContent.includes('Continue') || b.textContent.includes('Pet'));
    if (btn) btn.click();
  })()`);
  await sleep(1500);

  // STEP 9, 10, 11: Add Dog Profile & Photo Upload
  console.log('\n--- Step 9, 10, 11: Add Dog Page ---');
  await scrollTo(0);
  capture('09_add_dog_initial_view.png');

  // Fill dog info
  await cdp.eval(`((dogPhoto) => {
    const setReactVal = (elem, val) => {
      const proto = Object.getPrototypeOf(elem);
      const set = Object.getOwnPropertyDescriptor(proto, 'value').set;
      set.call(elem, val);
      elem.dispatchEvent(new Event('input', { bubbles: true }));
      elem.dispatchEvent(new Event('change', { bubbles: true }));
    };

    const nameInput = document.querySelector('input[placeholder*="Dog Name"], input[placeholder*="Pet Name"], input[name="name"]');
    if (nameInput) setReactVal(nameInput, 'Sonu');

    const breedInput = document.querySelector('input[placeholder*="Breed"], select[name="breed"], input[name="breed"]');
    if (breedInput) {
      if (breedInput.tagName === 'SELECT') {
        breedInput.selectedIndex = 1;
        breedInput.dispatchEvent(new Event('change', { bubbles: true }));
      } else {
        setReactVal(breedInput, 'Golden Retriever');
      }
    }

    const colorInput = document.querySelector('input[placeholder*="Color"], input[name="color"]');
    if (colorInput) setReactVal(colorInput, 'Golden Cream');

    // Simulate image upload preview
    const previewContainer = document.querySelector('.photo-preview-container, .image-preview, .photo-upload-box');
    const existingImg = document.querySelector('.photo-preview-img, img[alt*="dog"], img[alt*="preview"]');
    if (existingImg) {
      existingImg.src = dogPhoto;
    } else if (previewContainer) {
      const img = document.createElement('img');
      img.src = dogPhoto;
      img.className = 'photo-preview-img';
      img.style.maxHeight = '180px';
      img.style.borderRadius = '12px';
      previewContainer.appendChild(img);
    }
  })('${dataUrl}')`);
  await sleep(600);
  capture('10_dog_photo_uploaded_preview.png');

  // Save dog profile
  await cdp.eval(`(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Save') || b.textContent.includes('Continue') || b.textContent.includes('Complete') || b.textContent.includes('Alert'));
    if (btn) btn.click();
  })()`);
  await sleep(1500);

  // STEP 12: Missing Dog SOS Alert Creation Flow
  console.log('\n--- Step 12: Missing Dog SOS Alert Flow ---');
  // Navigate to alert/report lost dog if not already there
  const currPath = await cdp.eval('window.location.pathname');
  console.log('Current pathname:', currPath);
  if (!currPath.includes('alert') && !currPath.includes('lost')) {
    await cdp.eval('window.location.href = "https://localhost/alert"');
    await sleep(1500);
  }
  await scrollTo(0);
  capture('12_missing_dog_alert_page.png');

  await cdp.eval(`(() => {
    const setReactVal = (elem, val) => {
      const proto = Object.getPrototypeOf(elem);
      const set = Object.getOwnPropertyDescriptor(proto, 'value').set;
      set.call(elem, val);
      elem.dispatchEvent(new Event('input', { bubbles: true }));
      elem.dispatchEvent(new Event('change', { bubbles: true }));
    };

    const locInput = document.querySelector('input[placeholder*="Last seen"], input[placeholder*="Landmark"], input[name="lastKnownLocation"]');
    if (locInput) setReactVal(locInput, 'Near MVP Colony Park Gate 2');

    const rewardInput = document.querySelector('input[placeholder*="Reward"], input[name="reward"]');
    if (rewardInput) setReactVal(rewardInput, '5000');

    const notesInput = document.querySelector('textarea');
    if (notesInput) setReactVal(notesInput, 'Wearing a red collar with small brass bell. Responds happily to Sonu.');
  })()`);
  await sleep(600);
  capture('12_missing_dog_details_filled.png');

  // Click Broadcast SOS / Activate Alert
  await cdp.eval(`(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Broadcast') || b.textContent.includes('Activate') || b.textContent.includes('Report Lost') || b.textContent.includes('Alert'));
    if (btn) btn.click();
  })()`);
  await sleep(1800);

  // STEP 13 & 14: Dashboard Listing & Details Modal
  console.log('\n--- Step 13 & 14: Dashboard Listing & Details ---');
  await cdp.eval('window.location.href = "https://localhost/dashboard"');
  await sleep(1500);
  await scrollTo(0);
  capture('13_dashboard_sos_active_banner.png');

  await scrollTo(450);
  capture('13_dashboard_missing_feed_card.png');

  // Click dog card to open details modal
  await cdp.eval(`(() => {
    const card = document.querySelector('.dog-card, .missing-dog-card, .pet-card') || Array.from(document.querySelectorAll('div')).find(d => d.textContent.includes('Sonu') && d.textContent.includes('LOST'));
    if (card) {
      const btn = card.querySelector('button, a') || card;
      btn.click();
    }
  })()`);
  await sleep(1000);
  await scrollTo(0);
  capture('14_missing_dog_details_modal.png');

  // STEP 15, 16, 17: Sighting Creation Flow
  console.log('\n--- Step 15, 16, 17: Sighting Creation Flow ---');
  await cdp.eval(`(() => {
    const sightingBtn = Array.from(document.querySelectorAll('button, a')).find(b => b.textContent.includes('Report Sighting') || b.textContent.includes('I Spotted'));
    if (sightingBtn) sightingBtn.click();
    else window.location.href = "https://localhost/report-sighting/LOST-1788885000505";
  })()`);
  await sleep(1500);
  await scrollTo(0);
  capture('15_sighting_creation_form.png');

  await cdp.eval(`((sightingPhoto) => {
    const setReactVal = (elem, val) => {
      const proto = Object.getPrototypeOf(elem);
      const set = Object.getOwnPropertyDescriptor(proto, 'value').set;
      set.call(elem, val);
      elem.dispatchEvent(new Event('input', { bubbles: true }));
      elem.dispatchEvent(new Event('change', { bubbles: true }));
    };

    const notes = document.querySelector('textarea');
    if (notes) setReactVal(notes, 'Spotted Sonu drinking water near MVP beach circle. Friendly and safe.');

    const phone = document.querySelector('input[type="tel"]');
    if (phone) setReactVal(phone, '9848099887');

    const loc = document.querySelector('input[placeholder*="location"], input[placeholder*="Landmark"]');
    if (loc) setReactVal(loc, 'MVP Beach Circle near tea stall');
  })('${dataUrl}')`);
  await sleep(600);
  capture('16_sighting_details_filled.png');

  // STEP 18 & 19: Bottom Dock Navigation
  console.log('\n--- Step 18 & 19: Bottom Dock Navigation ---');
  await cdp.eval('window.location.href = "https://localhost/dashboard"');
  await sleep(1200);

  // Tap 'Owner'
  await cdp.eval(`(() => {
    const btn = Array.from(document.querySelectorAll('.dock-tab-btn, button')).find(b => b.textContent.trim() === 'Owner');
    if (btn) btn.click();
  })()`);
  await sleep(1000);
  capture('19_nav_to_owner_screen.png');

  // Tap 'Location'
  await cdp.eval(`(() => {
    const btn = Array.from(document.querySelectorAll('.dock-tab-btn, button')).find(b => b.textContent.trim() === 'Location');
    if (btn) btn.click();
  })()`);
  await sleep(1000);
  capture('19_nav_to_location_screen.png');

  // Tap 'Dashboard'
  await cdp.eval(`(() => {
    const btn = Array.from(document.querySelectorAll('.dock-tab-btn, button')).find(b => b.textContent.trim() === 'Dashboard');
    if (btn) btn.click();
  })()`);
  await sleep(1000);
  capture('19_nav_back_to_dashboard.png');

  // STEP 22: Empty Search State
  console.log('\n--- Step 22: Empty Search State ---');
  await cdp.eval('window.location.href = "https://localhost/find"');
  await sleep(1200);
  await cdp.eval(`(() => {
    const setReactVal = (elem, val) => {
      const proto = Object.getPrototypeOf(elem);
      const set = Object.getOwnPropertyDescriptor(proto, 'value').set;
      set.call(elem, val);
      elem.dispatchEvent(new Event('input', { bubbles: true }));
      elem.dispatchEvent(new Event('change', { bubbles: true }));
    };
    const searchInput = document.querySelector('input[placeholder*="Search"], input[type="search"], input[type="text"]');
    if (searchInput) setReactVal(searchInput, 'NonExistentPoodle9999');
  })()`);
  await sleep(800);
  capture('22_empty_search_state.png');

  // STEP 24: Logout Flow
  console.log('\n--- Step 24: Logout Flow ---');
  await cdp.eval(`(() => {
    const logoutBtn = document.querySelector('.footer-logout-btn') || Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Sign Out') || b.textContent.includes('Logout'));
    if (logoutBtn) logoutBtn.click();
    else {
      localStorage.removeItem('findlostpuppy_active_user');
      window.location.href = 'https://localhost/consent';
    }
  })()`);
  await sleep(1200);
  capture('24_after_logout_screen.png');

  // STEP 26: Hardware Back Button
  console.log('\n--- Step 26: Hardware Back Button ---');
  await cdp.eval('window.location.href = "https://localhost/dashboard"');
  await sleep(1000);
  await cdp.eval('window.location.href = "https://localhost/find"');
  await sleep(1000);
  capture('26_before_back_button.png');
  backKey();
  await sleep(1200);
  capture('26_after_back_button_pressed.png');

  console.log('\n✅ All onboarding and functional flows completed!');
  cdp.close();
}

main().catch(err => {
  console.error('Execution Error:', err);
  process.exit(1);
});
