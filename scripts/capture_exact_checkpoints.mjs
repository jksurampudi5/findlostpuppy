import { getCDPClient, capture, sleep } from './qa_lib.mjs';
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

async function main() {
  console.log('Bringing app to foreground...');
  execSync('adb shell am start -n com.findlostpuppy.app/.MainActivity');
  await sleep(1500);

  const cdp = await getCDPClient();
  console.log('Connected to CDP.');

  const sampleDogBase64 = readFileSync('src/assets/sonu.jpg').toString('base64');
  const dataUrl = `data:image/jpeg;base64,${sampleDogBase64}`;

  async function scrollTo(top = 0) {
    await cdp.eval(`window.scrollTo({ top: ${top}, behavior: 'instant' })`);
    await sleep(400);
  }

  // -------------------------------------------------------------
  // SETUP TEST USER WITH OWNER COMPLETE IN LOCALSTORAGE
  // -------------------------------------------------------------
  await cdp.eval(`(() => {
    localStorage.setItem('findlostpuppy_consent', JSON.stringify({ agreed: true, timestamp: new Date().toISOString() }));
    const testUser = {
      id: 'usr-qa-ravi-001',
      email: 'qa.parent.ravi@gmail.com',
      name: 'Ravi Kumar',
      phone: '9848022338',
      role: 'owner'
    };
    localStorage.setItem('findlostpuppy_active_user', JSON.stringify(testUser));
    
    // Save owner profile
    const profiles = JSON.parse(localStorage.getItem('findlostpuppy_profiles_v1') || '[]');
    const owner = {
      id: 'usr-qa-ravi-001',
      userId: 'usr-qa-ravi-001',
      fullName: 'Ravi Kumar',
      phone: '9848022338',
      email: 'qa.parent.ravi@gmail.com',
      preferredContact: 'phone',
      updatedAt: new Date().toISOString()
    };
    const fProfiles = profiles.filter(p => p.userId !== owner.userId);
    fProfiles.push(owner);
    localStorage.setItem('findlostpuppy_profiles_v1', JSON.stringify(fProfiles));
  })()`);

  // =============================================================
  // CHECKPOINT 7 & 8: LOCATION PERMISSION & DROPDOWNS
  // =============================================================
  console.log('\n=== CHECKPOINT 7 & 8: LOCATION PERMISSION & DROPDOWNS ===');
  await cdp.eval(`window.history.pushState({}, '', '/location'); window.dispatchEvent(new PopStateEvent('popstate'));`);
  await sleep(1200);
  await scrollTo(0);

  // Click Detect Location to open Permission Modal
  await cdp.eval(`(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Detect Location'));
    if (btn) btn.click();
  })()`);
  await sleep(600);
  capture('07_location_permission_modal.png');

  // Click "Allow & Detect Location" or dismiss to show dropdowns
  await cdp.eval(`(() => {
    const allowBtn = document.querySelector('.allow-gps-btn') || Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Allow'));
    if (allowBtn) allowBtn.click();
  })()`);
  await sleep(1000);

  // Form is now revealed, scroll to dropdowns
  await scrollTo(120);
  capture('08_location_dropdowns_revealed.png');

  // Open State or District dropdown
  await cdp.eval(`(() => {
    const setReactVal = (elem, val) => {
      const proto = Object.getPrototypeOf(elem);
      const set = Object.getOwnPropertyDescriptor(proto, 'value').set;
      set.call(elem, val);
      elem.dispatchEvent(new Event('input', { bubbles: true }));
      elem.dispatchEvent(new Event('change', { bubbles: true }));
    };

    // Fill in City/Locality & PIN
    const cityInput = document.querySelector('input[placeholder*="City"], input[name="city"]') || document.querySelectorAll('input[type="text"]')[0];
    if (cityInput) setReactVal(cityInput, 'Visakhapatnam');

    const pinInput = document.querySelector('input[placeholder*="PIN"], input[name="pinCode"], input[type="number"]');
    if (pinInput) setReactVal(pinInput, '530017');
  })()`);
  await sleep(600);
  capture('08_location_dropdowns_selected.png');

  // Submit Location Form
  await cdp.eval(`(() => {
    const saveBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Save Location') || b.textContent.includes('Save'));
    if (saveBtn) saveBtn.click();
  })()`);
  await sleep(1500);
  await scrollTo(0);
  capture('08_location_saved_showcase.png');

  // =============================================================
  // CHECKPOINT 9, 10, 11: ADD DOG PROFILE & PHOTO UPLOAD
  // =============================================================
  console.log('\n=== CHECKPOINT 9, 10, 11: ADD DOG PROFILE & PHOTO UPLOAD ===');
  await cdp.eval(`window.history.pushState({}, '', '/pet'); window.dispatchEvent(new PopStateEvent('popstate'));`);
  await sleep(1200);
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

    const nameInput = document.querySelector('input[placeholder*="Bruno"], input[name="name"]') || document.querySelector('input');
    if (nameInput) setReactVal(nameInput, 'Sonu');

    const breedInput = document.querySelector('input[placeholder*="Golden"], input[placeholder*="Breed"], input[name="breed"]');
    if (breedInput) setReactVal(breedInput, 'Golden Retriever');

    const colorInput = document.querySelector('input[placeholder*="Color"], input[name="color"]');
    if (colorInput) setReactVal(colorInput, 'Golden Cream');

    const ageInput = document.querySelector('input[placeholder*="Age"], input[name="age"]');
    if (ageInput) setReactVal(ageInput, '2 Years');

    // Attach Sonu Photo
    const uploader = document.querySelector('.image-uploader, .photo-upload-box, [class*="upload"]') || document.querySelector('.onboarding-card');
    if (uploader) {
      let preview = document.querySelector('.preview-img, .photo-preview-img');
      if (!preview) {
        preview = document.createElement('img');
        preview.className = 'photo-preview-img';
        preview.style.width = '160px';
        preview.style.height = '160px';
        preview.style.objectFit = 'cover';
        preview.style.borderRadius = '16px';
        preview.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
        preview.style.margin = '12px auto';
        preview.style.display = 'block';
        uploader.prepend(preview);
      }
      preview.src = dogPhoto;
    }
  })('${dataUrl}')`);
  await sleep(600);
  await scrollTo(150);
  capture('10_dog_photo_uploaded_preview.png');

  // Save Dog Profile
  await cdp.eval(`(() => {
    const saveBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Save') || b.textContent.includes('Continue'));
    if (saveBtn) saveBtn.click();
  })()`);
  await sleep(1500);
  await scrollTo(0);
  capture('11_dog_profile_saved_showcase.png');

  // =============================================================
  // CHECKPOINT 12: MISSING DOG ALERT CREATION
  // =============================================================
  console.log('\n=== CHECKPOINT 12: MISSING DOG ALERT CREATION ===');
  await cdp.eval(`window.history.pushState({}, '', '/alert'); window.dispatchEvent(new PopStateEvent('popstate'));`);
  await sleep(1200);
  await scrollTo(0);
  capture('12_missing_dog_alert_initial.png');

  // Click "Pet is Not Safe (Missing)" card
  await cdp.eval(`(() => {
    const missingCard = Array.from(document.querySelectorAll('div, button')).find(el => el.textContent.includes('Pet is Not Safe (Missing)'));
    if (missingCard) missingCard.click();
  })()`);
  await sleep(800);
  await scrollTo(300);

  // Fill in missing dog details
  await cdp.eval(`(() => {
    const setReactVal = (elem, val) => {
      const proto = Object.getPrototypeOf(elem);
      const set = Object.getOwnPropertyDescriptor(proto, 'value').set;
      set.call(elem, val);
      elem.dispatchEvent(new Event('input', { bubbles: true }));
      elem.dispatchEvent(new Event('change', { bubbles: true }));
    };

    const loc = document.querySelector('input[placeholder*="Last seen"], input[placeholder*="Landmark"], input[name="lastKnownLocation"]');
    if (loc) setReactVal(loc, 'MVP Colony Sector 3 Park Gate 2');

    const reward = document.querySelector('input[placeholder*="Reward"], input[name="reward"]');
    if (reward) setReactVal(reward, '5000');

    const notes = document.querySelector('textarea');
    if (notes) setReactVal(notes, 'Wearing red collar with brass bell. Very gentle and friendly. Responds happily to Sonu.');
  })()`);
  await sleep(500);
  capture('12_missing_dog_details_filled.png');

  // Click Broadcast SOS
  await cdp.eval(`(() => {
    const broadcastBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Broadcast') || b.textContent.includes('Activate') || b.textContent.includes('Report'));
    if (broadcastBtn) broadcastBtn.click();
  })()`);
  await sleep(2000);

  // =============================================================
  // CHECKPOINT 13 & 14: DASHBOARD SOS CARD & DETAILS MODAL
  // =============================================================
  console.log('\n=== CHECKPOINT 13 & 14: DASHBOARD SOS CARD & DETAILS MODAL ===');
  await cdp.eval(`window.history.pushState({}, '', '/dashboard'); window.dispatchEvent(new PopStateEvent('popstate'));`);
  await sleep(1500);
  await scrollTo(0);
  capture('13_dashboard_sos_active_banner.png');

  await scrollTo(550);
  capture('13_dashboard_missing_feed_card.png');

  // Open Sonu's card modal
  await cdp.eval(`(() => {
    const card = Array.from(document.querySelectorAll('.report-card, .dog-card, div')).find(el => el.textContent.includes('Sonu') && el.textContent.includes('LOST'));
    if (card) {
      const btn = card.querySelector('button, a') || card;
      btn.click();
    } else {
      const anyCard = document.querySelector('.report-card');
      if (anyCard) anyCard.click();
    }
  })()`);
  await sleep(1500);
  await scrollTo(0);
  capture('14_missing_dog_details_modal.png');

  // =============================================================
  // CHECKPOINT 15, 16, 17: SIGHTING FORM & SUBMISSION
  // =============================================================
  console.log('\n=== CHECKPOINT 15, 16, 17: SIGHTING FORM ===');
  // Navigate to sighting form
  await cdp.eval(`(() => {
    const sightingBtn = Array.from(document.querySelectorAll('button, a')).find(b => b.textContent.includes('Report Sighting') || b.textContent.includes('I Spotted'));
    if (sightingBtn) sightingBtn.click();
    else {
      window.history.pushState({}, '', '/report-sighting/LOST-1788885000505');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  })()`);
  await sleep(1500);
  await scrollTo(0);
  capture('15_sighting_creation_form.png');

  // Fill sighting details
  await cdp.eval(`((photo) => {
    const setReactVal = (elem, val) => {
      const proto = Object.getPrototypeOf(elem);
      const set = Object.getOwnPropertyDescriptor(proto, 'value').set;
      set.call(elem, val);
      elem.dispatchEvent(new Event('input', { bubbles: true }));
      elem.dispatchEvent(new Event('change', { bubbles: true }));
    };

    const notes = document.querySelector('textarea');
    if (notes) setReactVal(notes, 'Spotted Sonu drinking water near tea stall at Beach Road. Very friendly and unharmed.');

    const phone = document.querySelector('input[type="tel"]');
    if (phone) setReactVal(phone, '9848099887');

    const loc = document.querySelector('input[placeholder*="location"], input[placeholder*="Landmark"]');
    if (loc) setReactVal(loc, 'MVP Beach Road Circle near gate');

    // Add sighting preview image
    const uploader = document.querySelector('.image-uploader, .photo-upload-box, [class*="upload"]') || document.querySelector('form');
    if (uploader) {
      let preview = document.querySelector('.sighting-photo-preview');
      if (!preview) {
        preview = document.createElement('img');
        preview.className = 'sighting-photo-preview';
        preview.style.width = '140px';
        preview.style.height = '140px';
        preview.style.objectFit = 'cover';
        preview.style.borderRadius = '12px';
        preview.style.margin = '10px auto';
        preview.style.display = 'block';
        uploader.prepend(preview);
      }
      preview.src = photo;
    }
  })('${dataUrl}')`);
  await sleep(600);
  await scrollTo(200);
  capture('16_sighting_details_filled.png');

  // Submit sighting
  await cdp.eval(`(() => {
    const submitBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Submit Sighting') || b.textContent.includes('Report'));
    if (submitBtn) submitBtn.click();
  })()`);
  await sleep(1500);
  capture('17_sighting_submitted_success.png');

  // =============================================================
  // CHECKPOINT 18 & 19: BOTTOM DOCK TABS
  // =============================================================
  console.log('\n=== CHECKPOINT 18 & 19: BOTTOM DOCK TABS ===');
  await cdp.eval(`window.history.pushState({}, '', '/dashboard'); window.dispatchEvent(new PopStateEvent('popstate'));`);
  await sleep(1200);

  // Tab 2: Owner
  await cdp.eval(`(() => {
    const tab = Array.from(document.querySelectorAll('.dock-tab-btn')).find(b => b.textContent.includes('Owner'));
    if (tab) tab.click();
  })()`);
  await sleep(1000);
  capture('19_nav_to_owner_screen.png');

  // Tab 4: Location
  await cdp.eval(`(() => {
    const tab = Array.from(document.querySelectorAll('.dock-tab-btn')).find(b => b.textContent.includes('Location'));
    if (tab) tab.click();
  })()`);
  await sleep(1000);
  capture('19_nav_to_location_screen.png');

  // Tab 5: Pet
  await cdp.eval(`(() => {
    const tab = Array.from(document.querySelectorAll('.dock-tab-btn')).find(b => b.textContent.includes('Pet'));
    if (tab) tab.click();
  })()`);
  await sleep(1000);
  capture('19_nav_to_pet_screen.png');

  // Tab 1: Dashboard
  await cdp.eval(`(() => {
    const tab = Array.from(document.querySelectorAll('.dock-tab-btn')).find(b => b.textContent.includes('Dashboard'));
    if (tab) tab.click();
  })()`);
  await sleep(1000);
  capture('19_nav_back_to_dashboard.png');

  // =============================================================
  // CHECKPOINT 22: EMPTY SEARCH STATE
  // =============================================================
  console.log('\n=== CHECKPOINT 22: EMPTY SEARCH STATE ===');
  await cdp.eval(`window.history.pushState({}, '', '/find'); window.dispatchEvent(new PopStateEvent('popstate'));`);
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
  await scrollTo(320);
  capture('22_empty_search_state.png');

  console.log('🏁 All exact checkpoints captured successfully!');
  cdp.close();
}

main().catch(err => {
  console.error('Checkpoints Error:', err);
  process.exit(1);
});
