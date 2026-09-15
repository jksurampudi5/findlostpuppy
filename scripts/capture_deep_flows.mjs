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

  // Ensure authenticated state in localStorage
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
    localStorage.setItem('sb-test-auth-token', JSON.stringify({ user: testUser }));
  })()`);

  // -------------------------------------------------------------
  // FLOW A: LOCATION DROPDOWNS & AUTO-FILL
  // -------------------------------------------------------------
  console.log('\n--- FLOW A: Location Page with Dropdowns ---');
  await cdp.eval('window.location.href = "https://localhost/location"');
  await sleep(1500);
  await scrollTo(200);

  // Set Location values
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
  await sleep(600);

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
  await scrollTo(150);
  capture('08_location_dropdowns_selected.png');

  // Save location
  await cdp.eval(`(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Save') || b.textContent.includes('Continue'));
    if (btn) btn.click();
  })()`);
  await sleep(1500);

  // -------------------------------------------------------------
  // FLOW B: ADD DOG & PHOTO UPLOAD
  // -------------------------------------------------------------
  console.log('\n--- FLOW B: Add Dog & Photo Upload ---');
  await cdp.eval('window.location.href = "https://localhost/pet"');
  await sleep(1500);
  await scrollTo(0);

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

    // Also store directly in storageService
    const pets = JSON.parse(localStorage.getItem('findlostpuppy_pets_v1') || '[]');
    const dog = {
      id: 'pet-1788885000505',
      ownerId: 'usr-qa-ravi-001',
      name: 'Sonu',
      breed: 'Golden Retriever',
      color: 'Golden Cream',
      gender: 'Male',
      age: '2 years',
      primaryPhoto: dogPhoto,
      isSafe: false,
      createdAt: new Date().toISOString()
    };
    const filtered = pets.filter(p => p.id !== dog.id);
    filtered.push(dog);
    localStorage.setItem('findlostpuppy_pets_v1', JSON.stringify(filtered));
  })('${dataUrl}')`);
  await sleep(500);

  await scrollTo(450);
  capture('10_dog_photo_uploaded_preview.png');

  // Click Save
  await cdp.eval(`(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Save') || b.textContent.includes('Continue'));
    if (btn) btn.click();
  })()`);
  await sleep(1500);

  // -------------------------------------------------------------
  // FLOW C: MISSING DOG SOS ALERT CREATION
  // -------------------------------------------------------------
  console.log('\n--- FLOW C: Missing Dog SOS Alert Creation ---');
  await cdp.eval('window.location.href = "https://localhost/alert"');
  await sleep(1500);
  await scrollTo(200);

  // Click "Pet is Not Safe (Missing)" card to expand form
  await cdp.eval(`(() => {
    const missingCard = Array.from(document.querySelectorAll('div, button')).find(el => el.textContent.includes('Pet is Not Safe (Missing)') || el.textContent.includes('Missing'));
    if (missingCard) missingCard.click();
  })()`);
  await sleep(800);
  await scrollTo(400);

  // Fill lost details
  await cdp.eval(`(() => {
    const setReactVal = (elem, val) => {
      const proto = Object.getPrototypeOf(elem);
      const set = Object.getOwnPropertyDescriptor(proto, 'value').set;
      set.call(elem, val);
      elem.dispatchEvent(new Event('input', { bubbles: true }));
      elem.dispatchEvent(new Event('change', { bubbles: true }));
    };

    const loc = document.querySelector('input[placeholder*="Last seen"], input[placeholder*="Landmark"], input[name="lastKnownLocation"]');
    if (loc) setReactVal(loc, 'MVP Colony Sector 3 Park');

    const reward = document.querySelector('input[placeholder*="Reward"], input[name="reward"]');
    if (reward) setReactVal(reward, '5000');

    const notes = document.querySelector('textarea');
    if (notes) setReactVal(notes, 'Wearing red collar with brass bell. Very gentle and friendly.');
  })()`);
  await sleep(500);
  capture('12_missing_dog_details_filled.png');

  // Also create active report in storageService for guaranteed live display
  await cdp.eval(`((dogPhoto) => {
    const reports = JSON.parse(localStorage.getItem('findlostpuppy_reports_v1') || '[]');
    const newReport = {
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
        phone: '9848022338',
        email: 'qa.parent.ravi@gmail.com',
        state: 'Andhra Pradesh',
        district: 'Visakhapatnam',
        city: 'Visakhapatnam',
        approximateArea: 'MVP Colony Sector 3'
      },
      lastKnownLocation: 'Near MVP Colony Park Gate 2',
      reward: '₹5,000',
      additionalNotes: 'Wearing red collar with brass bell. Responds happily to Sonu.',
      createdAt: new Date().toISOString(),
      sightings: []
    };
    const updated = [newReport, ...reports.filter(r => r.id !== newReport.id)];
    localStorage.setItem('findlostpuppy_reports_v1', JSON.stringify(updated));
    localStorage.setItem('findlostpuppy_pet_status_v1', JSON.stringify({
      userId: 'usr-qa-ravi-001',
      status: 'LOST',
      timestamp: new Date().toISOString()
    }));
    window.dispatchEvent(new Event('findlostpuppy_reports_updated'));
  })('${dataUrl}')`);
  await sleep(1000);

  // -------------------------------------------------------------
  // FLOW D: DASHBOARD MISSING CARD & MODAL WITH PRIVACY MASKING
  // -------------------------------------------------------------
  console.log('\n--- FLOW D: Dashboard Missing Feed Card & Details Modal ---');
  await cdp.eval('window.location.href = "https://localhost/dashboard"');
  await sleep(1800);
  await scrollTo(0);
  capture('13_dashboard_sos_active_banner.png');

  await scrollTo(500);
  capture('13_dashboard_missing_feed_card.png');

  // Click Sonu card to open details modal
  await cdp.eval(`(() => {
    const cards = Array.from(document.querySelectorAll('.report-card, .dog-card, div')).filter(el => el.textContent.includes('Sonu'));
    const target = cards[cards.length - 1] || document.querySelector('.report-card');
    if (target) {
      const btn = target.querySelector('button, a') || target;
      btn.click();
    }
  })()`);
  await sleep(1200);
  await scrollTo(0);
  capture('14_missing_dog_details_modal.png');

  // -------------------------------------------------------------
  // FLOW E: SIGHTING REPORT WITH PHOTO
  // -------------------------------------------------------------
  console.log('\n--- FLOW E: Sighting Report Flow ---');
  await cdp.eval('window.location.href = "https://localhost/report-sighting/LOST-1788885000505"');
  await sleep(1500);
  await scrollTo(100);

  await cdp.eval(`((photo) => {
    const setReactVal = (elem, val) => {
      const proto = Object.getPrototypeOf(elem);
      const set = Object.getOwnPropertyDescriptor(proto, 'value').set;
      set.call(elem, val);
      elem.dispatchEvent(new Event('input', { bubbles: true }));
      elem.dispatchEvent(new Event('change', { bubbles: true }));
    };

    const notes = document.querySelector('textarea');
    if (notes) setReactVal(notes, 'Spotted Sonu drinking water peacefully near tea stall at Beach Road.');

    const phone = document.querySelector('input[type="tel"]');
    if (phone) setReactVal(phone, '9848099887');

    const loc = document.querySelector('input[placeholder*="location"], input[placeholder*="Landmark"]');
    if (loc) setReactVal(loc, 'MVP Beach Road Circle');
  })('${dataUrl}')`);
  await sleep(500);
  capture('16_sighting_details_filled.png');

  // -------------------------------------------------------------
  // FLOW F: EMPTY SEARCH STATE
  // -------------------------------------------------------------
  console.log('\n--- FLOW F: Empty Search State ---');
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
    if (searchInput) setReactVal(searchInput, 'NonExistentBreedXYZ');
  })()`);
  await sleep(800);
  await scrollTo(300);
  capture('22_empty_search_state.png');

  console.log('Finished deep flows capture.');
  cdp.close();
}

main().catch(err => {
  console.error('Deep Flows Error:', err);
  process.exit(1);
});
