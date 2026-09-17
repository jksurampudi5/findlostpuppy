import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE_URL = 'http://localhost:5173';
const OUTPUT_DIR = '/Users/jayakrishna/Desktop/findlostpuppy-playstore-assets';
const DESKTOP_DIR = '/Users/jayakrishna/Desktop';

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function captureScreenshots() {
  console.log('🚀 Launching headless Chrome for Play Store screenshot capture...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--hide-scrollbars',
      '--disable-web-security',
    ],
  });

  const page = await browser.newPage();

  // Android standard mobile viewport: 412x915 with scale factor 2.625 = 1081x2401 (rounded to 1080x2400)
  await page.setViewport({
    width: 412,
    height: 915,
    deviceScaleFactor: 2.621359, // Exactly 1080 x 2400 output
    isMobile: true,
    hasTouch: true,
  });

  // Pre-seed localStorage before ANY script executes on every navigation
  await page.evaluateOnNewDocument(() => {
    const userId = 'user-parent-jk';
    const email = 'jksurampudi5@gmail.com';

    // 1. Consent Record
    const consent = {
      consentVersion: '1.0',
      termsVersion: '1.0',
      privacyVersion: '1.0',
      disclaimerVersion: '1.0',
      guidelinesVersion: '1.0',
      acceptedForms: {
        terms: true,
        privacy: true,
        disclaimer: true,
        guidelines: true,
        declaration: true,
      },
      agreedAt: new Date().toISOString(),
      userId: userId,
      consentMethod: 'master_declaration',
    };
    localStorage.setItem('findlostpuppy_consent_v1', JSON.stringify(consent));

    // 2. Active User
    const user = {
      id: userId,
      email: email,
      name: 'Jksurampudi',
      phone: '8639452948',
      avatar: '/src/assets/sonu.jpg',
      isAdmin: true,
      createdAt: '2026-09-08T00:00:00.000Z',
    };
    localStorage.setItem('findlostpuppy_active_user', JSON.stringify(user));
    localStorage.setItem('findlostpuppy_registered_users_v1', JSON.stringify([user]));
    localStorage.setItem('findlostpuppy_current_user_v1', JSON.stringify(user));

    // 3. Owner Profile
    const ownerProfile = {
      id: `owner-${userId}`,
      userId: userId,
      fullName: 'Jksurampudi',
      phone: '8639452948',
      email: email,
      photo: '/src/assets/sonu.jpg',
      state: 'Andhra Pradesh',
      district: 'West Godavari',
      mandalOrMunicipality: 'Undrajavaram',
      streetOrLocality: 'Palangi',
      pinCode: '534216',
      stateCode: 28,
      districtCode: 504,
      subDistrictCode: 4945,
      localityCode: 588214,
      localityType: 'VILLAGE',
      preferredContact: 'phone',
      hasLocationConsent: true,
      approximateArea: 'Near Palangi, Undrajavaram, West Godavari',
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem('findlostpuppy_profiles_v1', JSON.stringify([ownerProfile]));

    // 4. Pet Profile
    const petProfile = {
      id: 'pet-bruno-jk',
      ownerId: userId,
      name: 'Bruno',
      breed: 'Golden Labrador • Companion Pet',
      gender: 'Male',
      age: '2 years',
      size: 'Medium (10-25kg)',
      color: 'Golden Cream',
      distinguishingMarks: 'Gentle, friendly, golden coat with white chest star',
      collarInfo: 'Reflective red collar with QR tag',
      microchipId: '985141002348911',
      primaryPhoto: '/src/assets/sonu.jpg',
      photos: ['/src/assets/sonu.jpg'],
      createdAt: '2026-09-08T12:00:00.000Z',
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem('findlostpuppy_pets_v1', JSON.stringify([petProfile]));
    localStorage.setItem('findlostpuppy_splash_seen_v1', 'true');
  });

  const screenshots = [
    {
      name: 'playstore_screenshot_1_dashboard',
      path: '/dashboard',
      desktopName: 'phone-screenshot-1.png',
      description: 'Community Recovery Dashboard — Missing Dogs, Safe Dogs, and Live Radar Metrics',
      prepare: async () => {
        await page.waitForSelector('.dashboard-page', { timeout: 15000 }).catch(() => {});
        await page.evaluate(() => {
          const splash = document.querySelector('.launch-overlay-backdrop, .launch-logo-stage');
          if (splash) splash.remove();
        });
        await new Promise((r) => setTimeout(r, 1500));
      },
    },
    {
      name: 'playstore_screenshot_2_pet_showcase',
      path: '/pet',
      desktopName: 'phone-screenshot-2.png',
      description: 'Pet Profile & Showcase — Bruno the Indie Furry Friend with Traits and Protected Identity',
      prepare: async () => {
        await page.waitForSelector('.pet-profile-showcase, .onboarding-card', { timeout: 15000 }).catch(() => {});
        await page.evaluate(() => {
          const splash = document.querySelector('.launch-overlay-backdrop, .launch-logo-stage');
          if (splash) splash.remove();
        });
        await new Promise((r) => setTimeout(r, 1500));
      },
    },
    {
      name: 'playstore_screenshot_3_owner_location',
      path: '/location',
      desktopName: 'phone-screenshot-3.png',
      description: 'Pet Safe-Zone & Location Hub — Verified Home Base in Andhra Pradesh',
      prepare: async () => {
        await page.waitForSelector('.location-preview-showcase, .location-onboarding-card', { timeout: 15000 }).catch(() => {});
        await page.evaluate(() => {
          const splash = document.querySelector('.launch-overlay-backdrop, .launch-logo-stage');
          if (splash) splash.remove();
        });
        await new Promise((r) => setTimeout(r, 1500));
      },
    },
    {
      name: 'playstore_screenshot_4_dog_detail',
      path: '/dog/LOST-1788807276098',
      desktopName: 'phone-screenshot-4.png',
      description: 'Emergency Dog Detail & Sighting Trail — Location Coordinates and Community Help',
      prepare: async () => {
        await page.waitForSelector('.dog-detail-page, .dog-profile-container', { timeout: 15000 }).catch(() => {});
        await page.evaluate(() => {
          const splash = document.querySelector('.launch-overlay-backdrop, .launch-logo-stage');
          if (splash) splash.remove();
          const vp = document.querySelector('.app-main-viewport') || document.scrollingElement || document.documentElement;
          if (vp) {
            vp.scrollTop = 320;
          }
        });
        await new Promise((r) => setTimeout(r, 1500));
      },
    },
    {
      name: 'playstore_screenshot_5_report_sos',
      path: '/alert',
      desktopName: 'phone-screenshot-5.png',
      description: '1-Click WhatsApp SOS Alert & Instant Missing Flyer Generator',
      prepare: async () => {
        await page.waitForSelector('.report-page, .report-wizard-container, .card', { timeout: 15000 }).catch(() => {});
        await page.evaluate(() => {
          const splash = document.querySelector('.launch-overlay-backdrop, .launch-logo-stage');
          if (splash) splash.remove();
        });
        await new Promise((r) => setTimeout(r, 1500));
      },
    },
  ];

  for (const item of screenshots) {
    console.log(`📸 Capturing ${item.name} (${item.path})...`);
    await page.goto(`${BASE_URL}${item.path}`, { waitUntil: 'networkidle2' }).catch(() => {});
    await item.prepare();

    // Dismiss any modal/splash overlay that might be lingering
    await page.evaluate(() => {
      const splash = document.querySelector('.launch-overlay-backdrop');
      if (splash) splash.remove();
    });

    await new Promise((r) => setTimeout(r, 800));

    const outPath1 = path.join(OUTPUT_DIR, `${item.name}.png`);
    const outPathDesktop = path.join(DESKTOP_DIR, item.desktopName);

    await page.screenshot({ path: outPath1, type: 'png' });
    fs.copyFileSync(outPath1, outPathDesktop);

    console.log(`✓ Saved to ${outPath1} and ${outPathDesktop}`);
  }

  await browser.close();
  console.log('🎉 All Play Store screenshots captured successfully without any crash dialogs!');
}

captureScreenshots().catch((err) => {
  console.error('Screenshot capture failed:', err);
  process.exit(1);
});
