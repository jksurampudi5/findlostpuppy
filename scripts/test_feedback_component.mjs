import puppeteer from 'puppeteer-core';

const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE_URL = 'http://localhost:5173';

async function runTests() {
  console.log('🚀 Running Feedback Component Automated Verification Suite...\n');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  let passed = 0;
  let total = 0;

  await page.evaluateOnNewDocument(() => {
    sessionStorage.setItem('findlostpuppy_launch_seen', 'true');
    localStorage.setItem('findlostpuppy_gratitude_seen', 'true');
    localStorage.setItem('findlostpuppy_consent_accepted', 'true');
    localStorage.setItem('suggestion_shown', 'true');
    localStorage.setItem('findlostpuppy_suggestion_shown', 'true');
  });

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
    // TEST 1: Desktop Sidebar Feedback Button Click
    // -------------------------------------------------------------
    console.log('\n--- TEST 1: Desktop Sidebar Feedback Button ---');
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto(`${BASE_URL}/homepage`, { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 1000));

    // Clear any existing localStorage flags so we start clean
    await page.evaluate(() => {
      localStorage.setItem('suggestion_shown', 'true'); // avoid auto-popup interfering
      localStorage.setItem('findlostpuppy_suggestion_shown', 'true');
    });

    // Check if sidebar feedback tab exists
    const suggestTab = await page.$('#sidebar-suggest-tab');
    assert(suggestTab !== null, 'Sidebar feedback button (#sidebar-suggest-tab) exists in DOM');

    // Click sidebar feedback tab
    await page.evaluate(() => {
      const el = document.getElementById('sidebar-suggest-tab');
      if (el) el.click();
    });
    await new Promise(r => setTimeout(r, 600));

    // Verify modal overlay appears
    const modalOverlay = await page.$('.suggestion-modal-overlay');
    assert(modalOverlay !== null, 'Feedback modal overlay (.suggestion-modal-overlay) is open and rendered');

    const modalTitle = await page.evaluate(() => {
      const el = document.querySelector('.suggestion-modal-title');
      return el ? el.textContent : '';
    });
    assert(modalTitle.includes('Feedback') || modalTitle.includes('Rating'), `Modal title is correct: "${modalTitle.trim()}"`);

    // -------------------------------------------------------------
    // TEST 2: Star Rating & Review Submission
    // -------------------------------------------------------------
    console.log('\n--- TEST 2: Star Rating & Feedback Form Submission ---');
    // Select 4th star
    const starBtns = await page.$$('.suggestion-star-btn');
    assert(starBtns.length === 5, `Found 5 rating star buttons (found ${starBtns.length})`);
    if (starBtns.length >= 4) {
      await starBtns[3].click(); // 4 stars
      await new Promise(r => setTimeout(r, 200));
    }

    const ratingDesc = await page.evaluate(() => {
      const el = document.querySelector('.suggestion-rating-desc');
      return el ? el.textContent : '';
    });
    assert(ratingDesc.includes('Great experience'), `Rating description reflects 4 stars: "${ratingDesc}"`);

    // Verify Play Store Review link uses om.findlostpuppy.app
    const playStoreHref = await page.evaluate(() => {
      const link = document.querySelector('.suggestion-playstore-link-btn');
      return link ? link.getAttribute('href') : '';
    });
    assert(
      playStoreHref.includes('om.findlostpuppy.app'),
      `Play Store link uses om.findlostpuppy.app (actual: "${playStoreHref}")`
    );

    // Type text into textarea
    await page.type('#suggestion-desc-input', 'Automated Test: The pet reunion workflow is seamless!');

    // Submit the feedback
    const submitBtn = await page.$('.suggestion-submit-btn');
    assert(submitBtn !== null, 'Submit button (.suggestion-submit-btn) exists');
    if (submitBtn) {
      await submitBtn.click();
      await new Promise(r => setTimeout(r, 800));
    }

    // Verify feedback was persisted in storage
    const savedSuggestions = await page.evaluate(() => {
      try {
        const raw = localStorage.getItem('findlostpuppy_suggestions_v1') || localStorage.getItem('findlostpuppy_suggestions');
        return raw ? JSON.parse(raw) : [];
      } catch {
        return [];
      }
    });

    assert(savedSuggestions.length > 0, `Suggestion successfully stored in localStorage (count: ${savedSuggestions.length})`);
    if (savedSuggestions.length > 0) {
      const latest = savedSuggestions[0];
      assert(latest.rating === 4, `Persisted rating is 4 (actual: ${latest.rating})`);
      assert(latest.category === 'praise', `Category auto-derived as praise for 4 stars (actual: ${latest.category})`);
      assert(latest.description.includes('Automated Test'), `Description persisted accurately`);
    }

    // Wait for auto-close (1.5s in code)
    await new Promise(r => setTimeout(r, 1800));
    const modalAfterSubmit = await page.$('.suggestion-modal-overlay');
    assert(modalAfterSubmit === null, 'Modal automatically closed after successful submission');

    // -------------------------------------------------------------
    // TEST 3: Mobile Viewport & Drawer Feedback Item
    // -------------------------------------------------------------
    console.log('\n--- TEST 3: Mobile Viewport & Drawer Navigation ---');
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await page.goto(`${BASE_URL}/homepage`, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      localStorage.setItem('findlostpuppy_consent_accepted', 'true');
      localStorage.setItem('findlostpuppy_active_user', JSON.stringify({ id: 'tester-123', name: 'Tester', email: 'tester@example.com' }));
      sessionStorage.setItem('findlostpuppy_session_token_v1', 'mock_session_token');
    });
    await page.goto(`${BASE_URL}/homepage`, { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 800));

    // Open mobile hamburger menu
    const menuBtn = await page.$('.mobile-menu-trigger-btn');
    assert(menuBtn !== null, 'Mobile hamburger menu button exists');
    if (menuBtn) {
      await page.evaluate(() => {
        const btn = document.querySelector('.mobile-menu-trigger-btn');
        if (btn) btn.click();
      });
      await new Promise(r => setTimeout(r, 400));
    }

    // Find and click Feedback item in mobile drawer
    const drawerFeedbackClicked = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('.drawer-nav-item'));
      const el = items.find(el => el.textContent.includes('Feedback'));
      if (el) {
        el.click();
        return true;
      }
      return false;
    });
    assert(drawerFeedbackClicked, 'Feedback item clicked in mobile navigation drawer');
    await new Promise(r => setTimeout(r, 600));

    const mobileModalOverlay = await page.$('.suggestion-modal-overlay');
    assert(mobileModalOverlay !== null, 'Feedback modal opens from mobile drawer');

    // Check no horizontal overflow on mobile viewport
    const overflowCheck = await page.evaluate(() => {
      const dialog = document.querySelector('.suggestion-modal-dialog');
      if (!dialog) return { fits: false, width: 0, viewportWidth: window.innerWidth };
      const rect = dialog.getBoundingClientRect();
      return {
        fits: rect.width <= window.innerWidth,
        width: rect.width,
        viewportWidth: window.innerWidth
      };
    });
    assert(overflowCheck.fits, `Mobile modal fits within viewport (modal: ${overflowCheck.width}px, viewport: ${overflowCheck.viewportWidth}px)`);

    // Close modal via close button
    const closeBtn = await page.$('.suggestion-modal-close');
    assert(closeBtn !== null, 'Modal close button exists');
    if (closeBtn) {
      await closeBtn.click();
      await new Promise(r => setTimeout(r, 400));
    }
    const mobileModalClosed = await page.$('.suggestion-modal-overlay');
    assert(mobileModalClosed === null, 'Modal closes cleanly on mobile via close button');

    // -------------------------------------------------------------
    // TEST 4: Direct URL Navigation (/feedback and /suggest)
    // -------------------------------------------------------------
    console.log('\n--- TEST 4: Direct URL Navigation (/feedback) ---');
    await page.goto(`${BASE_URL}/feedback`, { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 800));

    const directUrlModal = await page.$('.suggestion-modal-overlay');
    assert(directUrlModal !== null, 'Navigating directly to /feedback auto-opens the feedback modal');

    // Close modal via close button
    const directCloseBtn = await page.$('.suggestion-modal-close');
    if (directCloseBtn) {
      await directCloseBtn.click();
      await new Promise(r => setTimeout(r, 500));
    }

    const currentPath = await page.evaluate(() => window.location.pathname);
    assert(currentPath.includes('/homepage') || currentPath === '/', `Closing /feedback navigates to homepage (current: ${currentPath})`);

    // -------------------------------------------------------------
    // TEST 5: Footer Quick Links Feedback Button
    // -------------------------------------------------------------
    console.log('\n--- TEST 5: Footer Quick Links ---');
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto(`${BASE_URL}/homepage`, { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 800));

    const footerFeedbackBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('.app-footer .footer-link-btn'));
      return btns.find(b => b.textContent.includes('Feedback & Suggestions'));
    });
    assert(footerFeedbackBtn !== null, 'Feedback & Suggestions button exists in Footer');

    if (footerFeedbackBtn) {
      await footerFeedbackBtn.click();
      await new Promise(r => setTimeout(r, 500));
    }

    const footerOpenedModal = await page.$('.suggestion-modal-overlay');
    assert(footerOpenedModal !== null, 'Clicking footer Feedback button opens modal');

    // Close modal
    const closeBtnFooter = await page.$('.suggestion-modal-close');
    if (closeBtnFooter) {
      await closeBtnFooter.click();
      await new Promise(r => setTimeout(r, 400));
    }

  } catch (err) {
    console.error('Unhandled test failure:', err);
  } finally {
    await browser.close();
  }

  console.log(`\n========================================`);
  console.log(`TEST SUMMARY: ${passed} / ${total} tests passed.`);
  console.log(`========================================\n`);

  if (passed !== total) {
    process.exit(1);
  }
}

runTests();
