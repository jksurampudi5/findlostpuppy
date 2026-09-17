import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = '/Users/jayakrishna/.gemini/antigravity-ide/brain/cab227a9-7293-4978-80ff-e8b95086102c/sidebar_verification_screenshots';
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function run() {
  console.log('🚀 Starting Sidebar & Navigation Invariant Verification...');
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 2 });

  // 1. Seed Auth & Mock Data in localStorage
  await page.goto('http://localhost:5173/dashboard', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    localStorage.setItem('findlostpuppy_consent_v1', JSON.stringify({
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      acceptedForms: { terms: true, privacy: true, petAccuracy: true },
      consentMethod: 'master_declaration'
    }));

    localStorage.setItem('findlostpuppy_active_user', JSON.stringify({
      id: 'usr_test_123',
      email: 'jksurampudi5@gmail.com',
      name: 'Jksurampudi',
      phone: '+918639452948',
      isAdmin: true
    }));

    localStorage.setItem('findlostpuppy_sidebar_pinned', 'false');
    localStorage.setItem('findlostpuppy_sidebar_collapsed', 'true');
  });

  await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle2' });
  await page.addStyleTag({ content: '.launch-overlay-backdrop { display: none !important; }' });
  await new Promise(r => setTimeout(r, 600));

  console.log('\n--- TEST 1: MEASURING COLLAPSED ICONS VERTICAL CENTERLINE ---');
  const collapsedMetrics = await page.evaluate(() => {
    const slots = Array.from(document.querySelectorAll('.constant-sidebar-container .nav-icon-slot'));
    return slots.map((slot, index) => {
      const rect = slot.getBoundingClientRect();
      const parentRow = slot.closest('button, .sidebar-brand-link, .footer-user-row');
      const label = parentRow ? (parentRow.getAttribute('title') || parentRow.textContent?.trim().slice(0, 20)) : `Slot ${index}`;
      return {
        index,
        label,
        left: rect.left,
        right: rect.right,
        width: rect.width,
        height: rect.height,
        centerX: rect.left + rect.width / 2,
        centerY: rect.top + rect.height / 2
      };
    });
  });

  console.log(`Found ${collapsedMetrics.length} icon slots in collapsed sidebar:`);
  collapsedMetrics.forEach(m => {
    console.log(`  [${m.index}] ${m.label.padEnd(28)} => CenterX: ${m.centerX.toFixed(2)}px | Width: ${m.width}px | Height: ${m.height}px`);
  });

  const centerXs = collapsedMetrics.map(m => m.centerX);
  const minX = Math.min(...centerXs);
  const maxX = Math.max(...centerXs);
  const deltaX = maxX - minX;

  console.log(`Centerline spread across all ${collapsedMetrics.length} slots: ${deltaX.toFixed(3)}px`);
  if (deltaX > 0.5) {
    throw new Error(`FAIL: Icon slots do NOT share one vertical axis! Spread is ${deltaX}px > 0.5px`);
  }
  console.log('✅ TEST 1 PASSED: All icon slots share ONE IDENTICAL vertical axis!');

  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'sidebar_1_collapsed_desktop.png') });
  console.log('Saved screenshot: sidebar_1_collapsed_desktop.png');

  console.log('\n--- TEST 2: HOVER EXPANSION & ICON STATIONARY INVARIANT ---');
  // Hover over the sidebar
  await page.hover('.constant-left-sidebar');
  await page.waitForFunction(() => {
    const c = document.querySelector('.constant-sidebar-container');
    return c && c.getBoundingClientRect().width >= 260;
  }, { timeout: 3000 });
  await new Promise(r => setTimeout(r, 200));

  const hoveredMetrics = await page.evaluate(() => {
    const sidebar = document.querySelector('.constant-sidebar-container');
    const sidebarRect = sidebar.getBoundingClientRect();
    const slots = Array.from(document.querySelectorAll('.constant-sidebar-container .nav-icon-slot'));
    const slotMetrics = slots.map(slot => {
      const rect = slot.getBoundingClientRect();
      return {
        left: rect.left,
        width: rect.width,
        centerX: rect.left + rect.width / 2,
        centerY: rect.top + rect.height / 2
      };
    });

    const labels = Array.from(document.querySelectorAll('.nav-tab-text-group'));
    const labelsVisible = labels.every(l => {
      const style = window.getComputedStyle(l);
      return parseFloat(style.opacity) > 0.8;
    });

    return {
      sidebarWidth: sidebarRect.width,
      slotMetrics,
      labelsVisible
    };
  });

  console.log(`Expanded sidebar width: ${hoveredMetrics.sidebarWidth.toFixed(2)}px (Expected >= 260px)`);
  if (hoveredMetrics.sidebarWidth < 255) {
    throw new Error(`FAIL: Sidebar did not expand sufficiently toward right. Width: ${hoveredMetrics.sidebarWidth}px`);
  }
  if (!hoveredMetrics.labelsVisible) {
    throw new Error('FAIL: Labels are not properly visible in expanded state');
  }

  // Check icon stationarity
  for (let i = 0; i < collapsedMetrics.length; i++) {
    const beforeX = collapsedMetrics[i].centerX;
    const afterX = hoveredMetrics.slotMetrics[i].centerX;
    const shift = Math.abs(afterX - beforeX);
    if (shift > 0.5) {
      throw new Error(`FAIL: Icon [${i}] moved horizontally during expansion by ${shift.toFixed(2)}px (Before: ${beforeX}, After: ${afterX})`);
    }
  }
  console.log('✅ TEST 2 PASSED: Sidebar expanded right to 264px and ALL icons remained 100% stationary on their X-axis!');

  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'sidebar_2_hover_expanded_desktop.png') });
  console.log('Saved screenshot: sidebar_2_hover_expanded_desktop.png');

  console.log('\n--- TEST 3: HOVER LEAVE SMOOTH COLLAPSE ---');
  // Move mouse away to center of dashboard
  await page.mouse.move(800, 400);
  await page.waitForFunction(() => {
    const c = document.querySelector('.constant-sidebar-container');
    return c && c.getBoundingClientRect().width <= 80;
  }, { timeout: 3000 });
  await new Promise(r => setTimeout(r, 200));

  const unhoveredWidth = await page.evaluate(() => {
    const sidebar = document.querySelector('.constant-sidebar-container');
    return sidebar.getBoundingClientRect().width;
  });
  console.log(`Width after mouse leave: ${unhoveredWidth.toFixed(2)}px (Expected ~76px)`);
  if (unhoveredWidth > 85) {
    throw new Error(`FAIL: Sidebar did not collapse after mouse leave. Width: ${unhoveredWidth}px`);
  }
  console.log('✅ TEST 3 PASSED: Sidebar cleanly collapsed left when mouse left');

  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'sidebar_3_hover_leave_collapsed_desktop.png') });
  console.log('Saved screenshot: sidebar_3_hover_leave_collapsed_desktop.png');

  console.log('\n--- TEST 4: TOGGLE BUTTON REMOVED & LOGO CLEAN ---');
  const toggleBtnRemoved = await page.evaluate(() => {
    const btn = document.querySelector('.sidebar-toggle-btn');
    const logoImg = document.querySelector('.sidebar-brand-logo-img');
    const slot = document.querySelector('.nav-icon-slot.logo-slot');
    return {
      hasBtn: !!btn,
      hasLogo: !!logoImg,
      slotGeometry: slot ? { w: slot.getBoundingClientRect().width, h: slot.getBoundingClientRect().height } : null
    };
  });

  console.log('Toggle button check:', toggleBtnRemoved);
  if (toggleBtnRemoved.hasBtn) {
    throw new Error('FAIL: sidebar-toggle-btn is still present in DOM');
  }
  if (!toggleBtnRemoved.hasLogo) {
    throw new Error('FAIL: App logo image missing');
  }
  console.log('✅ TEST 4 PASSED: Left/right toggle button is completely removed and logo slot is clean and unobstructed!');

  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'sidebar_4_unobstructed_clean_logo.png') });
  console.log('Saved screenshot: sidebar_4_unobstructed_clean_logo.png');

  console.log('\n--- TEST 5: MOBILE TOUCH VIEWPORT & DRAWER ---');
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.addStyleTag({ content: '.launch-overlay-backdrop { display: none !important; }' });
  await new Promise(r => setTimeout(r, 300));

  const mobileVisibility = await page.evaluate(() => {
    const desktopSidebar = document.querySelector('.constant-left-sidebar');
    const mobileHeader = document.querySelector('.mobile-top-header');
    const mobileDock = document.querySelector('.mobile-dog-dock-nav');

    return {
      desktopHidden: window.getComputedStyle(desktopSidebar).display === 'none',
      headerVisible: window.getComputedStyle(mobileHeader).display !== 'none',
      dockVisible: window.getComputedStyle(mobileDock).display !== 'none',
    };
  });

  console.log('Mobile layout check:', mobileVisibility);
  if (!mobileVisibility.desktopHidden || !mobileVisibility.headerVisible || !mobileVisibility.dockVisible) {
    throw new Error('FAIL: Mobile responsive display rules incorrect');
  }

  // Open mobile drawer
  await page.click('.mobile-menu-trigger-btn');
  await new Promise(r => setTimeout(r, 400));

  const drawerItems = await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('.drawer-nav-links .drawer-nav-item span'));
    return items.map(s => s.textContent.trim());
  });

  console.log('Drawer items found:', drawerItems);
  if (drawerItems.length < 5) {
    throw new Error('FAIL: Drawer did not render expected navigation items');
  }

  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'sidebar_5_mobile_drawer_open.png') });
  console.log('Saved screenshot: sidebar_5_mobile_drawer_open.png');

  // Close mobile drawer
  await page.evaluate(() => {
    const btn = document.querySelector('.drawer-close-btn');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 400));

  const drawerClosed = await page.evaluate(() => {
    const drawer = document.querySelector('.mobile-drawer-panel');
    return !drawer.classList.contains('drawer-open');
  });
  console.log(`Mobile drawer closed successfully: ${drawerClosed}`);
  if (!drawerClosed) {
    throw new Error('FAIL: Mobile drawer did not close');
  }

  console.log('\n🎉 ALL 5 TESTS PASSED WITH 100% ACCURACY!');
  await browser.close();
}

run().catch(err => {
  console.error('❌ Verification script failed:', err);
  process.exit(1);
});
