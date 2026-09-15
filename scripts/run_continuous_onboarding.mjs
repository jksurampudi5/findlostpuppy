import { getCDPClient, capture, backKey, sleep } from './qa_lib.mjs';
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

  // Ensure consent is accepted
  await cdp.eval(`localStorage.setItem('findlostpuppy_consent', JSON.stringify({ agreed: true, timestamp: new Date().toISOString() }))`);

  // Navigate to /login
  console.log('\n--- 1. Login with OTP ---');
  await cdp.eval(`(() => {
    if (window.location.pathname !== '/login') {
      window.location.href = 'https://localhost/login';
    }
  })()`);
  await sleep(1500);

  // Type email
  await cdp.eval(`(() => {
    const setReactVal = (elem, val) => {
      const proto = Object.getPrototypeOf(elem);
      const set = Object.getOwnPropertyDescriptor(proto, 'value').set;
      set.call(elem, val);
      elem.dispatchEvent(new Event('input', { bubbles: true }));
      elem.dispatchEvent(new Event('change', { bubbles: true }));
    };
    const emailInput = document.querySelector('input[type="email"]') || document.querySelector('input');
    if (emailInput) setReactVal(emailInput, 'qa.parent.ravi@gmail.com');
  })()`);
  await sleep(400);

  // Submit email
  await cdp.eval(`(() => {
    const btn = document.querySelector('button[type="submit"]') || Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Continue'));
    if (btn) btn.click();
  })()`);
  await sleep(1200);

  // Enter OTP 999999
  await cdp.eval(`(() => {
    const setReactVal = (elem, val) => {
      const proto = Object.getPrototypeOf(elem);
      const set = Object.getOwnPropertyDescriptor(proto, 'value').set;
      set.call(elem, val);
      elem.dispatchEvent(new Event('input', { bubbles: true }));
      elem.dispatchEvent(new Event('change', { bubbles: true }));
    };
    const otpInput = document.querySelector('input[placeholder*="OTP"], input[placeholder*="code"], input[type="tel"]') || document.querySelectorAll('input')[0];
    if (otpInput) setReactVal(otpInput, '999999');
  })()`);
  await sleep(400);

  // Click Verify OTP
  await cdp.eval(`(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Verify') || b.textContent.includes('Confirm'));
    if (btn) btn.click();
  })()`);
  await sleep(2000);

  // Now on Owner Profile Page
  console.log('\n--- 2. Fill Owner Profile ---');
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
  await sleep(2000);

  // Now on Location Page
  console.log('\n--- 3. Location Dropdowns ---');
  await scrollTo(250);
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
  await sleep(600);
  capture('08_location_dropdowns_selected.png');

  // Click Save & Continue to Pet
  await cdp.eval(`(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Save') || b.textContent.includes('Continue'));
    if (btn) btn.click();
  })()`);
  await sleep(2000);

  // Now on Pet Profile Page
  console.log('\n--- 4. Pet Profile & Photo ---');
  await scrollTo(0);
  capture('09_add_dog_initial_view.png');

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

    // Simulate photo upload
    const previewContainer = document.querySelector('.photo-preview-container, .image-preview, .photo-upload-box, [class*="upload"]');
    if (previewContainer) {
      let img = previewContainer.querySelector('img');
      if (!img) {
        img = document.createElement('img');
        img.className = 'photo-preview-img';
        img.style.maxHeight = '180px';
        img.style.borderRadius = '12px';
        img.style.marginTop = '8px';
        previewContainer.appendChild(img);
      }
      img.src = dogPhoto;
    }
  })('${dataUrl}')`);
  await sleep(600);
  await scrollTo(350);
  capture('10_dog_photo_uploaded_preview.png');

  // Click Save Pet Profile
  await cdp.eval(`(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Save') || b.textContent.includes('Continue') || b.textContent.includes('Alert'));
    if (btn) btn.click();
  })()`);
  await sleep(2000);

  // Now on Alert Page
  console.log('\n--- 5. Pet Alert Page ---');
  await scrollTo(0);
  capture('12_missing_dog_alert_initial.png');

  // Click "Pet is Not Safe (Missing)" card
  await cdp.eval(`(() => {
    const missingBtn = Array.from(document.querySelectorAll('button, div')).find(el => el.textContent.includes('Pet is Not Safe (Missing)') || el.textContent.includes('Not Safe'));
    if (missingBtn) missingBtn.click();
  })()`);
  await sleep(800);
  await scrollTo(400);

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
    if (notes) setReactVal(notes, 'Wearing red collar with brass bell. Very friendly, responds happily to Sonu.');
  })()`);
  await sleep(500);
  capture('12_missing_dog_details_filled.png');

  // Click Broadcast SOS / Activate Alert
  await cdp.eval(`(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Broadcast') || b.textContent.includes('Activate') || b.textContent.includes('Report Lost'));
    if (btn) btn.click();
  })()`);
  await sleep(2500);

  // Now on Dashboard
  console.log('\n--- 6. Dashboard Listings & Modal ---');
  await scrollTo(0);
  capture('13_dashboard_sos_active_banner.png');

  await scrollTo(600);
  capture('13_dashboard_missing_feed_card.png');

  // Click View Details / Card for Missing Dog
  await cdp.eval(`(() => {
    const card = document.querySelector('.report-card') || Array.from(document.querySelectorAll('div')).find(d => d.textContent.includes('Sonu') && d.textContent.includes('LOST'));
    if (card) {
      const btn = card.querySelector('button') || card.querySelector('a') || card;
      btn.click();
    }
  })()`);
  await sleep(1500);
  await scrollTo(0);
  capture('14_missing_dog_details_modal.png');

  // Bottom dock tab navigation
  console.log('\n--- 7. Bottom Dock Navigation ---');
  // Close modal if open
  await cdp.eval(`(() => {
    const closeBtn = document.querySelector('.modal-close, [aria-label="Close"], button.close');
    if (closeBtn) closeBtn.click();
  })()`);
  await sleep(500);

  // Click Owner Dock Tab
  await cdp.eval(`(() => {
    const btn = Array.from(document.querySelectorAll('.dock-tab-btn')).find(b => b.textContent.includes('Owner'));
    if (btn) btn.click();
  })()`);
  await sleep(1200);
  capture('19_nav_to_owner_screen.png');

  // Click Location Dock Tab
  await cdp.eval(`(() => {
    const btn = Array.from(document.querySelectorAll('.dock-tab-btn')).find(b => b.textContent.includes('Location'));
    if (btn) btn.click();
  })()`);
  await sleep(1200);
  capture('19_nav_to_location_screen.png');

  // Click Dashboard Dock Tab
  await cdp.eval(`(() => {
    const btn = Array.from(document.querySelectorAll('.dock-tab-btn')).find(b => b.textContent.includes('Dashboard'));
    if (btn) btn.click();
  })()`);
  await sleep(1200);
  capture('19_nav_back_to_dashboard.png');

  console.log('✅ Continuous onboarding finished successfully.');
  cdp.close();
}

main().catch(err => {
  console.error('Continuous Onboarding Error:', err);
  process.exit(1);
});
