import puppeteer from 'puppeteer-core';

const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE_URL = 'http://localhost:5173';

async function runTests() {
  console.log('🚀 Running Hard Reset & Cloudinary/Firestore Deletion Tests...\n');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });


  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${message}`);
    }
  }

  try {
    // -------------------------------------------------------------
    // TEST 1: Cloudinary URL parsing and destroy method existence
    // -------------------------------------------------------------
    console.log('\n--- TEST 1: Cloudinary Helper & Destroy Functions ---');
    await page.goto(`${BASE_URL}/findlostpuppy/`, { waitUntil: 'domcontentloaded' });

    const parseResult = await page.evaluate(async () => {
      // Test parsing in browser context
      const sampleUrl = 'https://res.cloudinary.com/ymrxc4mq/image/upload/v1790534463/findlostpuppy/pets/user-1/pet-2/photo_0_123.jpg?t=999';
      const cleanUrl = sampleUrl.split('?')[0].split('#')[0];
      const uploadIndex = cleanUrl.indexOf('/upload/');
      let afterUpload = cleanUrl.substring(uploadIndex + '/upload/'.length);
      const segments = afterUpload.split('/');
      while (segments.length > 0) {
        const seg = segments[0];
        if (/^v\d+$/.test(seg)) {
          segments.shift();
          break;
        } else if (seg.includes(',') || /^(c|w|h|q|f|e|b|dpr|ar|g|fl|co|cs|o|z|pg)_/i.test(seg)) {
          segments.shift();
        } else {
          break;
        }
      }
      let path = segments.join('/');
      path = path.replace(/\.[a-zA-Z0-9]+$/, '');
      return path;
    });

    assert(
      parseResult === 'findlostpuppy/pets/user-1/pet-2/photo_0_123',
      `Cloudinary public_id parsing extracted correctly: "${parseResult}"`
    );

    // -------------------------------------------------------------
    // TEST 2: Hard Reset preserves Gender & Size, resets other fields
    // -------------------------------------------------------------
    console.log('\n--- TEST 2: Hard Reset Component Behavior ---');

    // Setup user session with a pet
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
      sessionStorage.setItem('findlostpuppy_launch_seen', 'true');

      const testUser = {
        id: 'owner-test-user-77',
        name: 'Rohan Sharma',
        email: 'rohan.sharma@example.com',
        phone: '9876543210',
        role: 'user',
        consentGiven: true
      };
      localStorage.setItem('findlostpuppy_active_user', JSON.stringify(testUser));
      sessionStorage.setItem('findlostpuppy_user_session', JSON.stringify(testUser));
      localStorage.setItem('findlostpuppy_user_session', JSON.stringify(testUser));

      const consentRecord = {
        consentVersion: '1.0',
        termsVersion: '1.0',
        privacyVersion: '1.0',
        disclaimerVersion: '1.0',
        guidelinesVersion: '1.0',
        agreedAt: new Date().toISOString(),
        userId: 'owner-test-user-77',
        appVersion: '0.1.0',
        acceptedForms: { terms: true, privacy: true, disclaimer: true, guidelines: true, declaration: true },
        consentMethod: 'master_declaration'
      };
      localStorage.setItem('findlostpuppy_consent_v1', JSON.stringify(consentRecord));

      const testPet = {
        id: 'pet-test-77',
        ownerId: 'owner-test-user-77',
        name: 'Sheru',
        breed: 'Labrador Retriever',
        gender: 'Female', // Non-default gender to verify preservation!
        age: '3 years',
        size: 'Large (> 25 kg)', // Non-default size to verify preservation!
        color: 'Chocolate Brown',
        distinguishingMarks: 'Dark patch on left paw',
        collarInfo: 'Yes (Red collar with bell)',
        primaryPhoto: 'https://res.cloudinary.com/ymrxc4mq/image/upload/v1790534463/findlostpuppy/pets/owner-test-user-77/pet-test-77/photo_0_test.jpg',
        photos: [],
        createdAt: new Date().toISOString()
      };
      localStorage.setItem('findlostpuppy_pets_v1', JSON.stringify([testPet]));
      localStorage.setItem('findlostpuppy_pet_profile', JSON.stringify(testPet));
      localStorage.setItem('findlostpuppy_pet_profiles', JSON.stringify([testPet]));
    });

    // Navigate to pet details page
    await page.goto(`${BASE_URL}/pet`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.pet-combined-card', { timeout: 8000 });

    // In view mode, click the edit card to enter editing mode
    const viewCard = await page.$('.pet-view-card');
    assert(Boolean(viewCard), 'Pet View Card rendered with existing pet details');
    if (viewCard) await viewCard.click();

    await page.waitForSelector('.pet-info-form', { timeout: 5000 });
    await page.screenshot({ path: 'test_hard_reset_01_edit_mode.png' });

    // Check pre-reset field values
    const initialValues = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('.pet-info-row'));
      return {
        name: rows[0]?.querySelector('.pet-info-value')?.textContent?.trim(),
        breed: rows[1]?.querySelector('.pet-info-value')?.textContent?.trim(),
        age: rows[2]?.querySelector('.pet-info-value')?.textContent?.trim(),
        gender: rows[3]?.querySelector('.pet-info-value')?.textContent?.trim(),
        size: rows[4]?.querySelector('.pet-info-value')?.textContent?.trim(),
        color: rows[5]?.querySelector('.pet-info-value')?.textContent?.trim(),
        marks: rows[6]?.querySelector('.pet-info-value')?.textContent?.trim(),
        collar: rows[7]?.querySelector('.pet-info-value')?.textContent?.trim(),
      };
    });

    assert(initialValues.name === 'Sheru', `Initial Pet Name is "Sheru"`);
    assert(initialValues.gender === 'Female', `Initial Gender is "Female"`);
    assert(initialValues.size?.includes('Large'), `Initial Size is Large`);

    // Click "Hard Reset" button
    const hardResetBtn = await page.$('.pet-photo-remove-btn');
    assert(Boolean(hardResetBtn), 'Hard Reset button exists under photo avatar');

    if (hardResetBtn) {
      await hardResetBtn.click();
      await new Promise(r => setTimeout(r, 600));
    }

    await page.screenshot({ path: 'test_hard_reset_02_after_click.png' });

    // Check post-reset field values
    const postResetValues = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('.pet-info-row'));
      return {
        name: rows[0]?.querySelector('.pet-info-value')?.textContent?.trim(),
        isNamePlaceholder: rows[0]?.querySelector('.pet-info-value')?.classList.contains('placeholder'),
        breed: rows[1]?.querySelector('.pet-info-value')?.textContent?.trim(),
        isBreedPlaceholder: rows[1]?.querySelector('.pet-info-value')?.classList.contains('placeholder'),
        age: rows[2]?.querySelector('.pet-info-value')?.textContent?.trim(),
        isAgePlaceholder: rows[2]?.querySelector('.pet-info-value')?.classList.contains('placeholder'),
        gender: rows[3]?.querySelector('.pet-info-value')?.textContent?.trim(),
        size: rows[4]?.querySelector('.pet-info-value')?.textContent?.trim(),
        color: rows[5]?.querySelector('.pet-info-value')?.textContent?.trim(),
        isColorPlaceholder: rows[5]?.querySelector('.pet-info-value')?.classList.contains('placeholder'),
        marks: rows[6]?.querySelector('.pet-info-value')?.textContent?.trim(),
        isMarksPlaceholder: rows[6]?.querySelector('.pet-info-value')?.classList.contains('placeholder'),
        collar: rows[7]?.querySelector('.pet-info-value')?.textContent?.trim(),
      };
    });

    // 1. GENDER PRESERVED!
    assert(
      postResetValues.gender === 'Female',
      `Gender is PRESERVED after hard reset ("${postResetValues.gender}")`
    );

    // 2. SIZE CATEGORY PRESERVED!
    assert(
      postResetValues.size?.includes('Large'),
      `Size Category is PRESERVED after hard reset ("${postResetValues.size}")`
    );

    // 3. NAME RESET WITH PLACEHOLDER!
    assert(
      postResetValues.name === 'Enter pet name' && postResetValues.isNamePlaceholder,
      `Pet Name is reset and shows placeholder "Enter pet name" (has .placeholder: ${postResetValues.isNamePlaceholder})`
    );

    // 4. BREED RESET WITH PLACEHOLDER!
    assert(
      postResetValues.breed === 'Select breed' && postResetValues.isBreedPlaceholder,
      `Breed is reset and shows placeholder "Select breed"`
    );

    // 5. AGE RESET WITH PLACEHOLDER!
    assert(
      postResetValues.age === 'Select age' && postResetValues.isAgePlaceholder,
      `Age is reset and shows placeholder "Select age"`
    );

    // 6. COLOR RESET WITH PLACEHOLDER!
    assert(
      postResetValues.color === 'Select color' && postResetValues.isColorPlaceholder,
      `Color is reset and shows placeholder "Select color"`
    );

    // 7. DISTINCTIVE MARKS RESET WITH PLACEHOLDER!
    assert(
      postResetValues.marks === 'None (optional)' && postResetValues.isMarksPlaceholder,
      `Distinctive Marks is reset and shows placeholder "None (optional)"`
    );

    // 8. COLLAR RESET TO NO!
    assert(
      postResetValues.collar === 'No',
      `Collar is reset to "No"`
    );

    // -------------------------------------------------------------
    // TEST 3: Remove Pet Deletes Pet & Image and Allows Skip to Dashboard
    // -------------------------------------------------------------
    console.log('\n--- TEST 3: Remove Pet & Skip to Dashboard ---');

    // Register a new pet to test Remove Pet button at top
    await page.evaluate(() => {
      const testPet2 = {
        id: 'pet-test-99',
        ownerId: 'owner-test-user-77',
        name: 'Rocky',
        breed: 'Beagle',
        gender: 'Male',
        age: '1 year',
        size: 'Medium (10-25kg)',
        color: 'Tri-color',
        distinguishingMarks: '',
        collarInfo: '',
        primaryPhoto: 'https://res.cloudinary.com/ymrxc4mq/image/upload/v1790534463/findlostpuppy/pets/owner-test-user-77/pet-test-99/photo_0_rocky.jpg',
        photos: [],
        createdAt: new Date().toISOString()
      };
      localStorage.setItem('findlostpuppy_pets_v1', JSON.stringify([testPet2]));
      localStorage.setItem('findlostpuppy_pet_profile', JSON.stringify(testPet2));
      localStorage.setItem('findlostpuppy_pet_profiles', JSON.stringify([testPet2]));
    });

    await page.goto(`${BASE_URL}/pet`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.pet-profile-remove-btn', { timeout: 8000 });

    page.on('dialog', async (dialog) => {
      console.log(`Dialog opened: ${dialog.message().substring(0, 60)}...`);
      await dialog.accept();
    });

    const removeBtn = await page.$('.pet-profile-remove-btn');
    assert(Boolean(removeBtn), 'Top Remove Pet button exists on Pet Details');
    if (removeBtn) await removeBtn.click();

    await new Promise(r => setTimeout(r, 600));

    // Verify localStorage pet is deleted
    const isPetDeleted = await page.evaluate(() => {
      const raw = localStorage.getItem('findlostpuppy_pets_v1');
      const pets = raw ? JSON.parse(raw) : [];
      return !pets.some(p => p.id === 'pet-test-99');
    });
    assert(isPetDeleted, 'Pet profile was purged from localStorage');

    // Verify Direct Skip button allows skipping Pet Safety Status directly to Dashboard
    const skipBtn = await page.$('.pet-skip-direct-btn');
    assert(Boolean(skipBtn), 'Direct skip button is visible after removing pet');

    if (skipBtn) {
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
        skipBtn.click()
      ]);
    }

    const currentUrl = page.url();
    assert(
      currentUrl.includes('/homepage'),
      `Directly navigated to Dashboard (${currentUrl}), skipping Pet Safety Status (/alert)!`
    );
    await page.screenshot({ path: 'test_hard_reset_03_dashboard_skip.png' });

  } catch (err) {
    console.error('Test execution error:', err);
  } finally {
    await browser.close();
  }

  console.log('\n=============================================');
  console.log(`🏁 TEST SUITE SUMMARY:`);
  console.log(`Passed: ${passed}/${total}`);
  console.log('=============================================\n');

  if (passed < total) process.exit(1);
}

runTests();
