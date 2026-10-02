import puppeteer from 'puppeteer-core';
import { existsSync } from 'fs';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
if (!existsSync(CHROME_PATH)) {
  console.error('Chrome executable not found at', CHROME_PATH);
  process.exit(1);
}

async function run() {
  console.log('🐾 [TEST] Verifying pet deduplication, photo updates, and clean deletion...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--window-size=1280,800'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    // 1. Seed simulated user and single pet
    await page.goto('http://localhost:5173/homepage', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      localStorage.clear();
      const mockUser = {
        id: 'user_test_999',
        name: 'Test Parent',
        email: 'testparent@example.com',
        isAdmin: false,
      };
      localStorage.setItem('findlostpuppy_active_user', JSON.stringify(mockUser));
      localStorage.setItem('findlostpuppy_current_user', JSON.stringify(mockUser));
      localStorage.setItem('findlostpuppy_has_accepted_consent', 'true');
      localStorage.setItem('findlostpuppy_consent_accepted_user_test_999', 'true');
      localStorage.setItem('findlostpuppy_returning_user_user_test_999', 'true');

      const mockProfile = {
        id: 'user_test_999',
        userId: 'user_test_999',
        fullName: 'Test Parent',
        email: 'testparent@example.com',
        phone: '9876543210',
        city: 'Hyderabad',
        district: 'Hyderabad',
        state: 'Telangana',
        approximateArea: 'Banjara Hills, Hyderabad',
        hasLocationConsent: true,
      };
      localStorage.setItem('findlostpuppy_profiles_v1', JSON.stringify([mockProfile]));

      const mockPet = {
        id: 'pet_05',
        ownerId: 'user_test_999',
        name: 'pet05',
        breed: 'Street Dog / Desi / Indie',
        gender: 'Male',
        age: '2 years',
        size: 'Medium (10-25kg)',
        color: 'Golden / Fawn',
        distinguishingMarks: 'Friendly',
        primaryPhoto: 'https://res.cloudinary.com/ymrxc4mq/image/upload/v1790913833/test_dog.jpg',
        photos: ['https://res.cloudinary.com/ymrxc4mq/image/upload/v1790913833/test_dog.jpg'],
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem('findlostpuppy_pets_v1', JSON.stringify([mockPet]));

      // Intentionally insert a duplicate safe report with conflicting ID variant to test deduplication
      const duplicateReports = [
        {
          id: 'LOST-pet_05',
          dogId: 'pet_05',
          ownerId: 'user_test_999',
          dog: { ...mockPet },
          status: 'SAFE',
          lastKnownLocation: 'Banjara Hills, Hyderabad',
          ownerApproximateLocation: 'Banjara Hills, Hyderabad',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'user_test_999',
          dogId: 'pet_05',
          ownerId: 'user_test_999',
          dog: { ...mockPet },
          status: 'SAFE',
          lastKnownLocation: 'Banjara Hills, Hyderabad',
          ownerApproximateLocation: 'Banjara Hills, Hyderabad',
          createdAt: new Date().toISOString(),
        }
      ];
      localStorage.setItem('findlostpuppy_reports_v1', JSON.stringify(duplicateReports));
    });

    // Reload page to let storageService and DashboardPage initialize
    await page.goto('http://localhost:5173/homepage', { waitUntil: 'networkidle2' });

    // Open Pets at Home modal
    await page.waitForSelector('.dashboard-status-filter-btn.safe-filter', { visible: true });
    await page.evaluate(() => {
      document.querySelector('.dashboard-status-filter-btn.safe-filter')?.click();
    });
    await page.waitForSelector('.dashboard-status-modal-backdrop', { visible: true });

    // Check count of pet05 rows in Pets at Home
    const pet05Count = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('.dashboard-status-pet-row'));
      return rows.filter(r => (r.textContent || '').includes('pet05')).length;
    });

    console.log(`[CHECK 1] pet05 occurrences in Pets at Home: ${pet05Count}`);
    if (pet05Count === 1) {
      console.log('✅ [PASS] pet05 is strictly deduplicated to exactly 1 entry!');
    } else {
      console.error(`❌ [FAIL] Expected 1 pet05 entry, but found ${pet05Count}!`);
      process.exit(1);
    }

    // Check photo url rendered in pet05 row
    const renderedPhotoSrc = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('.dashboard-status-pet-row'));
      const pet05Row = rows.find(r => (r.textContent || '').includes('pet05'));
      const img = pet05Row?.querySelector('img.dashboard-status-pet-photo');
      return img ? img.src : null;
    });

    console.log(`[CHECK 2] pet05 photo src: ${renderedPhotoSrc}`);
    if (renderedPhotoSrc && renderedPhotoSrc.includes('test_dog.jpg')) {
      console.log('✅ [PASS] pet05 correctly reflects the Cloudinary photo in Dashboard!');
    } else {
      console.error('❌ [FAIL] pet05 did not reflect the Cloudinary photo! Got:', renderedPhotoSrc);
      process.exit(1);
    }

    // 2. Navigate to /pet and test "Delete Photo"
    await page.goto('http://localhost:5173/pet', { waitUntil: 'networkidle2' });
    await page.evaluate(() => {
      const modifyBtn = document.querySelector('.pet-modify-btn');
      if (modifyBtn) modifyBtn.click();
    });
    await page.waitForSelector('.pet-photo-remove-btn', { visible: true });

    // Click "Delete Photo"
    await page.evaluate(() => {
      const deleteBtn = Array.from(document.querySelectorAll('button')).find(
        (b) => b.textContent && b.textContent.includes('Delete Photo')
      );
      if (deleteBtn) deleteBtn.click();
    });
    await new Promise(r => setTimeout(r, 1200));

    // Verify photo preview is cleared and does NOT restore the old photo
    const previewAfterDelete = await page.evaluate(() => {
      const img = document.querySelector('.pet-photo-main-img');
      const placeholder = document.querySelector('.pet-photo-main-placeholder');
      return {
        hasImg: !!img,
        imgSrc: img ? img.src : null,
        hasPlaceholder: !!placeholder,
      };
    });

    console.log('[CHECK 3] Pet details photo after delete:', previewAfterDelete);
    if (!previewAfterDelete.hasImg && previewAfterDelete.hasPlaceholder) {
      console.log('✅ [PASS] Photo was deleted cleanly and placeholder is shown! Old photo was NOT restored.');
    } else {
      console.error('❌ [FAIL] Photo still appears or was restored:', previewAfterDelete);
      process.exit(1);
    }

    // 3. Navigate back to /homepage and verify Dashboard shows clean placeholder (NOT abulluImg)
    await page.goto('http://localhost:5173/homepage', { waitUntil: 'networkidle2' });
    await page.waitForSelector('.dashboard-status-filter-btn.safe-filter', { visible: true });
    await page.evaluate(() => {
      document.querySelector('.dashboard-status-filter-btn.safe-filter')?.click();
    });
    await page.waitForSelector('.dashboard-status-modal-backdrop', { visible: true });

    const dashboardPetAfterDelete = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('.dashboard-status-pet-row'));
      const pet05Row = rows.find(r => (r.textContent || '').includes('pet05'));
      const img = pet05Row?.querySelector('img.dashboard-status-pet-photo');
      const placeholder = pet05Row?.querySelector('.dashboard-status-pet-photo-placeholder');
      return {
        hasImg: !!img,
        imgSrc: img ? img.src : null,
        hasPlaceholder: !!placeholder,
      };
    });

    console.log('[CHECK 4] Dashboard pet05 after photo deletion:', dashboardPetAfterDelete);
    if (!dashboardPetAfterDelete.hasImg && dashboardPetAfterDelete.hasPlaceholder) {
      console.log('✅ [PASS] Dashboard pet05 shows clean SVG placeholder and NOT abulluImg!');
    } else {
      console.error('❌ [FAIL] Dashboard did not reflect photo removal:', dashboardPetAfterDelete);
      process.exit(1);
    }

    console.log('\n========================================');
    console.log('🎉 ALL DEDUPLICATION & PHOTO TESTS PASSED!');
    console.log('========================================\n');
  } finally {
    await browser.close();
  }
}

run().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
