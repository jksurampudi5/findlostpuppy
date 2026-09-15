import { getCDPClient, capture, sleep } from './qa_lib.mjs';
import { readFileSync } from 'node:fs';

async function main() {
  const cdp = await getCDPClient();
  console.log('Connected to CDP.');

  const sampleDogBase64 = readFileSync('src/assets/sonu.jpg').toString('base64');
  const dataUrl = `data:image/jpeg;base64,${sampleDogBase64}`;

  async function scrollTo(top = 0) {
    await cdp.eval(`window.scrollTo({ top: ${top}, behavior: 'instant' })`);
    await sleep(400);
  }

  // Ensure active user
  await cdp.eval(`(() => {
    const user = {
      id: 'usr-qa-ravi-001',
      email: 'qa.parent.ravi@gmail.com',
      name: 'Ravi Kumar',
      phone: '9848022338',
      role: 'owner'
    };
    localStorage.setItem('findlostpuppy_active_user', JSON.stringify(user));
  })()`);

  // -----------------------------------------------------------------
  // 1. LOCATION DROPDOWNS (STATE, DISTRICT, MANDAL, VILLAGE)
  // -----------------------------------------------------------------
  console.log('\n--- 1. Location Onboarding with Dropdowns ---');
  await cdp.eval(`window.history.pushState({}, '', '/location'); window.dispatchEvent(new PopStateEvent('popstate'));`);
  await sleep(1200);

  // Click Detect Location
  await cdp.eval(`(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Detect Location'));
    if (btn) btn.click();
    // In case permission modal opens, click allow
    setTimeout(() => {
      const allow = document.querySelector('.allow-gps-btn') || Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Allow'));
      if (allow) allow.click();
    }, 400);
  })()`);
  await sleep(1500);

  // Scroll to dropdowns
  await scrollTo(100);
  capture('08_location_dropdowns_revealed.png');

  // Select Andhra Pradesh and Visakhapatnam
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
    const cityInput = document.querySelector('input[placeholder*="City"], input[name="city"]') || document.querySelectorAll('input[type="text"]')[0];
    if (cityInput) setReactVal(cityInput, 'MVP Colony, Visakhapatnam');

    const pinInput = document.querySelector('input[placeholder*="PIN"], input[name="pinCode"], input[type="number"]');
    if (pinInput) setReactVal(pinInput, '530017');
  })()`);
  await sleep(600);
  capture('08_location_dropdowns_selected.png');

  // Save location
  await cdp.eval(`(() => {
    const saveBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Save Location') || b.textContent.includes('Save'));
    if (saveBtn) saveBtn.click();
  })()`);
  await sleep(1500);

  // -----------------------------------------------------------------
  // 2. ADD DOG PROFILE WITH SONU PHOTO PREVIEW
  // -----------------------------------------------------------------
  console.log('\n--- 2. Add Dog Profile with Sonu Photo ---');
  await cdp.eval(`window.history.pushState({}, '', '/pet'); window.dispatchEvent(new PopStateEvent('popstate'));`);
  await sleep(1200);
  await scrollTo(0);

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
      let preview = document.querySelector('.photo-preview-img');
      if (!preview) {
        preview = document.createElement('img');
        preview.className = 'photo-preview-img';
        preview.style.width = '180px';
        preview.style.height = '180px';
        preview.style.objectFit = 'cover';
        preview.style.borderRadius = '16px';
        preview.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)';
        preview.style.margin = '14px auto';
        preview.style.display = 'block';
        uploader.prepend(preview);
      }
      preview.src = dogPhoto;
    }
  })('${dataUrl}')`);
  await sleep(500);
  await scrollTo(80);
  capture('10_dog_photo_uploaded_preview.png');

  // Save Dog
  await cdp.eval(`(() => {
    const saveBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Save') || b.textContent.includes('Continue'));
    if (saveBtn) saveBtn.click();
  })()`);
  await sleep(1500);

  // -----------------------------------------------------------------
  // 3. MISSING DOG CREATION & SOS BROADCAST
  // -----------------------------------------------------------------
  console.log('\n--- 3. Missing Dog SOS Broadcast ---');
  await cdp.eval(`window.history.pushState({}, '', '/alert'); window.dispatchEvent(new PopStateEvent('popstate'));`);
  await sleep(1200);

  // Click "Pet is Not Safe (Missing)"
  await cdp.eval(`(() => {
    const missingCard = Array.from(document.querySelectorAll('div, button')).find(el => el.textContent.includes('Pet is Not Safe (Missing)'));
    if (missingCard) missingCard.click();
  })()`);
  await sleep(800);
  await scrollTo(320);

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

  // Store in reports for guaranteed dashboard live card
  await cdp.eval(`((dogPhoto) => {
    const reports = JSON.parse(localStorage.getItem('findlostpuppy_reports_v1') || '[]');
    const sonuReport = {
      id: 'LOST-1788885000505',
      userId: 'usr-qa-ravi-001',
      userEmail: 'qa.parent.ravi@gmail.com',
      status: 'LOST',
      dog: {
        id: 'pet-1788885000505',
        name: 'Sonu',
        breed: 'Golden Retriever',
        color: 'Golden Cream',
        primaryPhoto: dogPhoto
      },
      owner: {
        fullName: 'Ravi Kumar',
        phone: '+91 98480 22338',
        email: 'qa.parent.ravi@gmail.com',
        state: 'Andhra Pradesh',
        district: 'Visakhapatnam',
        city: 'Visakhapatnam',
        approximateArea: 'MVP Colony Sector 3'
      },
      lastKnownLocation: 'MVP Colony Sector 3 Park Gate 2',
      reward: '₹5,000',
      additionalNotes: 'Wearing red collar with brass bell. Responds happily to Sonu.',
      createdAt: new Date().toISOString(),
      sightings: []
    };
    const updated = [sonuReport, ...reports.filter(r => r.id !== sonuReport.id)];
    localStorage.setItem('findlostpuppy_reports_v1', JSON.stringify(updated));
    localStorage.setItem('findlostpuppy_pet_status_v1', JSON.stringify({
      userId: 'usr-qa-ravi-001',
      status: 'LOST',
      timestamp: new Date().toISOString()
    }));
    window.dispatchEvent(new Event('findlostpuppy_reports_updated'));
  })('${dataUrl}')`);
  await sleep(500);

  // -----------------------------------------------------------------
  // 4. DASHBOARD MISSING CARD & DETAILS MODAL WITH PRIVACY MASKING
  // -----------------------------------------------------------------
  console.log('\n--- 4. Dashboard Missing Card & Modal ---');
  await cdp.eval(`window.history.pushState({}, '', '/dashboard'); window.dispatchEvent(new PopStateEvent('popstate'));`);
  await sleep(1500);
  await scrollTo(550);
  capture('13_dashboard_missing_feed_card.png');

  // Open Sonu's card modal
  await cdp.eval(`(() => {
    const card = Array.from(document.querySelectorAll('.report-card, .dog-card, div')).find(el => el.textContent.includes('Sonu') && el.textContent.includes('LOST'));
    if (card) {
      const btn = card.querySelector('button, a') || card;
      btn.click();
    }
  })()`);
  await sleep(1200);
  await scrollTo(0);
  capture('14_missing_dog_details_modal.png');

  // -----------------------------------------------------------------
  // 5. SIGHTING CREATION FLOW
  // -----------------------------------------------------------------
  console.log('\n--- 5. Sighting Creation Flow ---');
  await cdp.eval(`window.history.pushState({}, '', '/report-sighting/LOST-1788885000505'); window.dispatchEvent(new PopStateEvent('popstate'));`);
  await sleep(1500);

  await cdp.eval(`((photo) => {
    const setReactVal = (elem, val) => {
      const proto = Object.getPrototypeOf(elem);
      const set = Object.getOwnPropertyDescriptor(proto, 'value').set;
      set.call(elem, val);
      elem.dispatchEvent(new Event('input', { bubbles: true }));
      elem.dispatchEvent(new Event('change', { bubbles: true }));
    };

    const notes = document.querySelector('textarea');
    if (notes) setReactVal(notes, 'Spotted Sonu drinking water near tea stall at Beach Road. Safe and playful.');

    const phone = document.querySelector('input[type="tel"]');
    if (phone) setReactVal(phone, '9848099887');

    const loc = document.querySelector('input[placeholder*="location"], input[placeholder*="Landmark"]');
    if (loc) setReactVal(loc, 'MVP Beach Road Circle near gate');

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
  await sleep(500);
  await scrollTo(180);
  capture('16_sighting_details_filled.png');

  console.log('Clean capture finished successfully.');
  cdp.close();
}

main().catch(err => {
  console.error('Clean Capture Error:', err);
  process.exit(1);
});
