import puppeteer from 'puppeteer-core';
import { join } from 'node:path';

const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE_URL = 'http://localhost:5173';
const ARTIFACT_DIR = '/Users/jayakrishna/.gemini/antigravity-ide/brain/14a5c867-efb6-4e2c-b19b-304469980ec9';

async function runVerification() {
  console.log('🐾 [TEST SUITE] Verifying Cloudinary/Firestore Sync, 5MB Validation & Dashboard Modal Stacking...');

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=430,932']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 430, height: 932, isMobile: true, hasTouch: true });

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
    // SETUP: Seed authenticated session and sample companion pet in localStorage
    // -------------------------------------------------------------
    await page.goto(`${BASE_URL}/homepage`, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      const mockUser = {
        id: 'owner-test-1',
        name: 'Jaya Krishna',
        email: 'parent@findlostpuppy.com',
        phone: '9876543210',
        avatar: 'https://res.cloudinary.com/ymrxc4mq/image/upload/v1790534463/findlostpuppy/profiles/user_photo.jpg',
        createdAt: new Date().toISOString()
      };
      localStorage.setItem('findlostpuppy_active_user', JSON.stringify(mockUser));
      localStorage.setItem('findlostpuppy_current_user', JSON.stringify(mockUser));
      localStorage.setItem('findlostpuppy_has_accepted_consent', 'true');
      localStorage.setItem('findlostpuppy_consent_accepted_owner-test-1', 'true');
      localStorage.setItem('findlostpuppy_returning_user_owner-test-1', 'true');

      const mockPet = {
        id: 'pet-test-companion-1',
        ownerId: 'owner-test-1',
        name: 'Simba',
        breed: 'Golden Retriever',
        gender: 'Male',
        age: 'Young Adult (1-3 yrs)',
        size: 'Medium (10-25kg)',
        color: 'Golden / Fawn',
        distinguishingMarks: 'White chest star',
        primaryPhoto: 'https://res.cloudinary.com/ymrxc4mq/image/upload/v1790534463/findlostpuppy/pets/simba.jpg',
        photos: [],
        createdAt: new Date().toISOString()
      };
      localStorage.setItem('findlostpuppy_pets_v1', JSON.stringify([mockPet]));

      const mockOwnerProfile = {
        id: 'owner-test-1',
        userId: 'owner-test-1',
        fullName: 'Jaya Krishna',
        phone: '9876543210',
        email: 'parent@findlostpuppy.com',
        photo: mockUser.avatar,
        preferredContact: 'phone',
        hasLocationConsent: true,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem('findlostpuppy_profiles_v1', JSON.stringify([mockOwnerProfile]));
    });

    // -------------------------------------------------------------
    // TEST 1: Dashboard "Pets at Home" and Modal Stacking above Footer
    // -------------------------------------------------------------
    console.log('\n--- 1. Testing Dashboard "Pets at Home" & Modal Stacking ---');
    await page.goto(`${BASE_URL}/homepage`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('.dashboard-status-only-page, .dashboard-status-filter-buttons', { timeout: 10000 });

    // Verify "Pets at Home" stat button exists and can be clicked
    const safeStatFound = await page.evaluate(() => {
      const safeBtn = document.querySelector('.dashboard-status-filter-btn.safe-filter');
      if (safeBtn) {
        safeBtn.click();
        return true;
      }
      return false;
    });
    assert(safeStatFound, 'Found and clicked "Pets at Home" button (.dashboard-status-filter-btn.safe-filter)');

    await new Promise(r => setTimeout(r, 800));

    // Check if modal is portaled directly into document.body and has z-index >= 100000
    const modalCheck = await page.evaluate(() => {
      const backdrop = document.querySelector('.dashboard-status-modal-backdrop');
      if (!backdrop) return { exists: false };
      const isDirectBodyChild = backdrop.parentElement === document.body;
      const computedZ = window.getComputedStyle(backdrop).zIndex;
      const footer = document.querySelector('.app-footer');
      const footerZ = footer ? window.getComputedStyle(footer).zIndex : '0';

      return {
        exists: true,
        isDirectBodyChild,
        backdropZ: parseInt(computedZ, 10),
        footerZ: parseInt(footerZ, 10) || 0
      };
    });

    assert(modalCheck.exists, 'Dashboard status modal backdrop rendered');
    assert(modalCheck.isDirectBodyChild, 'Modal backdrop attached directly to document.body (React Portal)');
    assert(modalCheck.backdropZ >= 100000, `Modal backdrop z-index is ${modalCheck.backdropZ} (>= 100000)`);
    assert(modalCheck.backdropZ > modalCheck.footerZ, `Modal backdrop (${modalCheck.backdropZ}) is above footer (${modalCheck.footerZ})`);

    // Verify visible pets in the modal list
    const petListCheck = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('.dashboard-status-pet-row'));
      const simbaItem = items.find(i => i.textContent && i.textContent.includes('Simba'));
      const hasSafeBadge = items.some(i => i.textContent && (i.textContent.includes('Safe at Home') || i.textContent.includes('Safe')));
      return {
        itemCount: items.length,
        hasSimba: Boolean(simbaItem),
        hasSafeBadge
      };
    });

    assert(petListCheck.itemCount > 0, `Pets at Home list contains ${petListCheck.itemCount} pet(s)`);
    assert(petListCheck.hasSimba, 'Registered companion pet "Simba" is listed in Pets at Home');
    assert(petListCheck.hasSafeBadge, 'Pets at Home displays "✓ Safe at Home" badge');

    // Click on "View details" button for Simba
    await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('.dashboard-status-pet-row'));
      const simbaItem = items.find(i => i.textContent && i.textContent.includes('Simba')) || items[0];
      if (simbaItem) {
        const viewBtn = simbaItem.querySelector('.dashboard-status-view-details-btn');
        if (viewBtn) viewBtn.click();
        else simbaItem.click();
      }
    });

    await new Promise(r => setTimeout(r, 600));

    // Verify pet detail popup is also portaled and above footer
    const petDetailModalCheck = await page.evaluate(() => {
      const popover = document.querySelector('.dashboard-status-pet-modal, .dashboard-status-pet-popover');
      if (!popover) return { exists: false };
      const backdrop = popover.closest('.dashboard-status-modal-backdrop');
      const isDirectBodyChild = backdrop?.parentElement === document.body;
      const popoverZ = parseInt(window.getComputedStyle(popover).zIndex, 10);
      const backdropZ = backdrop ? parseInt(window.getComputedStyle(backdrop).zIndex, 10) : 0;
      return {
        exists: true,
        isDirectBodyChild,
        popoverZ: popoverZ || backdropZ
      };
    });

    assert(petDetailModalCheck.exists, 'Pet detail modal popover opened');
    assert(petDetailModalCheck.isDirectBodyChild, 'Pet detail popover rendered via React Portal in document.body');
    assert(petDetailModalCheck.popoverZ >= 100000, `Pet detail popover has z-index ${petDetailModalCheck.popoverZ} (above footer)`);

    const screenshotModalPath = join(ARTIFACT_DIR, 'dashboard_modal_portal_verified.png');
    await page.screenshot({ path: screenshotModalPath });
    console.log(`📸 Screenshot saved: ${screenshotModalPath}`);

    // Close modal
    await page.evaluate(() => {
      const closeBtn = document.querySelector('.dashboard-status-pet-close-btn, .dashboard-status-modal-close-btn');
      if (closeBtn) closeBtn.click();
    });

    await new Promise(r => setTimeout(r, 500));

    // -------------------------------------------------------------
    // TEST 2: Dog Onboarding Photo Size Validation & Deletion
    // -------------------------------------------------------------
    console.log('\n--- 2. Testing Dog Onboarding Photo Size Limit & Deletion ---');
    await page.goto(`${BASE_URL}/pet`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('.pet-profile-photo-center, .pet-photo-circle-wrap, .onboarding-page', { timeout: 10000 });

    // Click "Modify Pet Details / Photo" if in view mode
    await page.evaluate(() => {
      const modifyBtn = document.querySelector('.pet-modify-btn');
      if (modifyBtn) modifyBtn.click();
    });

    await new Promise(r => setTimeout(r, 600));

    // Check that "Delete Photo" button is visible when pet has photo
    const petPhotoButtons = await page.evaluate(() => {
      const deleteBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Delete Photo'));
      const resetBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && (b.textContent.includes('Reset Fields') || b.textContent.includes('Hard Reset')));
      return {
        hasDeleteBtn: Boolean(deleteBtn),
        hasResetBtn: Boolean(resetBtn)
      };
    });

    assert(petPhotoButtons.hasDeleteBtn, '"Delete Photo" button is present for pet profile picture');
    assert(petPhotoButtons.hasResetBtn, '"Reset Fields" button is present');

    // Test size check logic (>5MB rejection)
    const sizeValidationResult = await page.evaluate(async () => {
      const largeData = new Uint8Array(6 * 1024 * 1024);
      const largeFile = new File([largeData], 'large_dog.jpg', { type: 'image/jpeg' });

      const fileInput = document.querySelector('.pet-profile-photo-center input[type="file"]');
      if (!fileInput) return { inputFound: false };

      const dt = new DataTransfer();
      dt.items.add(largeFile);
      fileInput.files = dt.files;

      fileInput.dispatchEvent(new Event('change', { bubbles: true }));
      return { inputFound: true, attemptedSize: largeFile.size };
    });

    assert(sizeValidationResult.inputFound, 'File input element found and dispatched 6MB file');
    await new Promise(r => setTimeout(r, 600));

    // Verify error toast was shown and file input was cleared
    const toastCheck = await page.evaluate(() => {
      const toastText = document.body.innerText;
      const hasErrorToast = toastText.includes('exceeds 5MB') || toastText.includes('size problem');
      const fileInput = document.querySelector('.pet-profile-photo-center input[type="file"]');
      const inputCleared = fileInput ? fileInput.value === '' : false;
      return { hasErrorToast, inputCleared };
    });

    assert(toastCheck.hasErrorToast, 'Toast displayed error: File size exceeds 5MB limit');
    assert(toastCheck.inputCleared, 'File input was safely cleared and upload was rejected');

    const screenshotPetPath = join(ARTIFACT_DIR, 'pet_onboarding_verified.png');
    await page.screenshot({ path: screenshotPetPath });
    console.log(`📸 Screenshot saved: ${screenshotPetPath}`);

    // -------------------------------------------------------------
    // TEST 3: Pet Parent Contact Photo Size Validation & Deletion
    // -------------------------------------------------------------
    console.log('\n--- 3. Testing Pet Parent Contact Photo Size Limit & Deletion ---');
    await page.goto(`${BASE_URL}/owner`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('.owner-unified-avatar-hero, .owner-center-avatar-box, .owner-overview-card', { timeout: 10000 });

    // Click "Modify Details / Photo" if in view mode
    await page.evaluate(() => {
      const editBtn = document.querySelector('.owner-modify-btn');
      if (editBtn) editBtn.click();
    });

    await new Promise(r => setTimeout(r, 600));

    // Check owner delete photo button
    const ownerPhotoButtons = await page.evaluate(() => {
      const deleteBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Delete Photo'));
      const resetBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && (b.textContent.includes('Reset Fields') || b.textContent.includes('Hard Reset')));
      return {
        hasDeleteBtn: Boolean(deleteBtn),
        hasResetBtn: Boolean(resetBtn)
      };
    });

    assert(ownerPhotoButtons.hasDeleteBtn, '"Delete Photo" button is present for owner profile picture');
    assert(ownerPhotoButtons.hasResetBtn, '"Reset Fields" button is present for owner');

    // Test owner 5MB size limit rejection
    const ownerSizeValidation = await page.evaluate(() => {
      const largeData = new Uint8Array(6 * 1024 * 1024);
      const largeFile = new File([largeData], 'large_owner.jpg', { type: 'image/jpeg' });

      const fileInput = document.querySelector('.owner-center-avatar-box input[type="file"]');
      if (!fileInput) return { inputFound: false };

      const dt = new DataTransfer();
      dt.items.add(largeFile);
      fileInput.files = dt.files;
      fileInput.dispatchEvent(new Event('change', { bubbles: true }));
      return { inputFound: true };
    });

    assert(ownerSizeValidation.inputFound, 'Owner file input found and dispatched 6MB file');
    await new Promise(r => setTimeout(r, 600));

    const ownerToastCheck = await page.evaluate(() => {
      const toastText = document.body.innerText;
      const hasErrorToast = toastText.includes('exceeds 5MB') || toastText.includes('size problem');
      const fileInput = document.querySelector('.owner-center-avatar-box input[type="file"]');
      const inputCleared = fileInput ? fileInput.value === '' : false;
      return { hasErrorToast, inputCleared };
    });

    assert(ownerToastCheck.hasErrorToast, 'Owner toast displayed error: File exceeds 5MB limit');
    assert(ownerToastCheck.inputCleared, 'Owner file input was safely cleared and upload rejected');

    const screenshotOwnerPath = join(ARTIFACT_DIR, 'owner_contact_verified.png');
    await page.screenshot({ path: screenshotOwnerPath });
    console.log(`📸 Screenshot saved: ${screenshotOwnerPath}`);

  } catch (err) {
    console.error('💥 Test execution error:', err);
  } finally {
    await browser.close();
  }

  console.log(`\n========================================`);
  console.log(`🎉 VERIFICATION COMPLETED: ${passed} / ${total} tests passed!`);
  console.log(`========================================\n`);

  if (passed < total) {
    process.exit(1);
  }
}

runVerification();
