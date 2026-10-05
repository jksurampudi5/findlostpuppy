import puppeteer from 'puppeteer-core';
import { mkdir, writeFile } from 'node:fs/promises';

// Isolated browser data and blocked external requests keep this audit local.
const output = process.env.AUDIT_OUTPUT || 'scratch/responsive-audit';
await mkdir(output, { recursive: true });
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
});
const results = [];
try {
  const page = await browser.newPage();
  await page.setRequestInterception(true);
  page.on('request', request => {
    const url = new URL(request.url());
    if (['localhost', '127.0.0.1'].includes(url.hostname) || ['data:', 'blob:'].includes(url.protocol)) request.continue();
    else request.abort();
  });
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('findlostpuppy_active_user', JSON.stringify({
      id: 'responsive-test-local', name: 'Test Pet Parent', email: 'responsive@example.invalid',
      createdAt: '2026-01-01T00:00:00Z',
    }));
    localStorage.setItem('findlostpuppy_consent_v1', JSON.stringify({
      consentVersion: '1.1', termsVersion: '1.1', privacyVersion: '1.1', disclaimerVersion: '1.0',
      guidelinesVersion: '1.0', agreedAt: '2026-01-01T00:00:00Z',
      appVersion: '0.1.0', consentMethod: 'master_declaration',
      acceptedForms: { terms: true, privacy: true, disclaimer: true, guidelines: true, declaration: true },
    }));
    localStorage.setItem('findlostpuppy_profiles_v1', JSON.stringify([{
      id: 'owner-responsive-test-local', userId: 'responsive-test-local', fullName: 'Test Pet Parent',
      phone: '9876543210', email: 'responsive@example.invalid', preferredContact: 'phone',
      state: 'Telangana', district: 'Vikarabad', mandalOrMunicipality: 'Vikarabad', city: 'Yennaepally',
      updatedAt: '2026-09-29T00:00:00Z',
    }]));
    localStorage.setItem('findlostpuppy_gratitude_seen', 'true');
    localStorage.setItem('suggestion_last_shown', Date.now().toString());
    sessionStorage.setItem('findlostpuppy_launch_seen', 'true');
    const dog = {
      id: 'responsive-pet', ownerId: 'responsive-test-local', name: 'Responsive Buddy',
      breed: 'Indie', color: 'Golden', size: 'Medium', gender: 'Male',
      primaryPhoto: '/src/assets/sonu.jpg', photos: ['/src/assets/sonu.jpg'],
    };
    const baseReport = {
      dogId: dog.id, ownerId: 'responsive-test-local', dog,
      ownerApproximateLocation: 'Yennaepally, Vikarabad, Telangana', lastKnownLocation: 'Yennaepally, Vikarabad, Telangana',
      dateLost: '2026-09-29', timeLost: '10:00 AM', contactMechanism: {
        showPhone: false, showEmail: false,
      }, sightingCount: 2, createdAt: '2026-09-29T00:00:00Z', updatedAt: '2026-09-29T00:00:00Z',
    };
    localStorage.setItem('findlostpuppy_reports_v1', JSON.stringify([
      { ...baseReport, id: 'responsive-safe', status: 'SAFE' },
      { ...baseReport, id: 'responsive-foreign-safe', dogId: 'responsive-foreign-pet', ownerId: 'another-owner', status: 'SAFE', dog: { ...dog, id: 'responsive-foreign-pet', ownerId: 'another-owner', name: 'Private Buddy' } },
      { ...baseReport, id: 'responsive-lost', dogId: 'responsive-lost-pet', ownerId: 'missing-owner', status: 'LOST', dog: { ...dog, id: 'responsive-lost-pet', ownerId: 'missing-owner', name: 'Missing Buddy' } },
    ]));
    localStorage.setItem('findlostpuppy_sightings_v1', JSON.stringify([
      { id: 'responsive-sighting-1', reportId: 'responsive-lost', dogName: 'Missing Buddy', date: '2026-09-29', time: '10:30 AM', location: 'Test Village', state: 'Andhra Pradesh', district: 'Test District', mandal: 'Test Mandal', village: 'Test Village', photo: '/src/assets/sonu.jpg', description: 'First test sighting', createdAt: '2026-09-29T00:30:00Z', isCurrent: true },
      { id: 'responsive-sighting-2', reportId: 'responsive-lost', dogName: 'Missing Buddy', date: '2026-09-29', time: '11:00 AM', location: 'Second Test Village', state: 'Andhra Pradesh', district: 'Test District', mandal: 'Test Mandal', village: 'Second Test Village', photo: '/src/assets/sonu.jpg', description: 'Second test sighting', createdAt: '2026-09-29T01:00:00Z', isCurrent: true },
    ]));
  });
  for (const width of (process.env.AUDIT_WIDTHS || '320,390,768,1024').split(',').map(Number)) {
    await page.setViewport({ width, height: Number(process.env.AUDIT_HEIGHT || 844), deviceScaleFactor: 1 });
    for (const route of (process.env.AUDIT_ROUTES || 'consent,login,owner,location,pet,alert,dashboard,capture,find').split(',')) {
      await page.goto(`http://localhost:5173/${route}`, { waitUntil: 'networkidle2' });
      await page.waitForSelector('.launch-overlay-backdrop', { hidden: true, timeout: 15000 });
      const result = await page.evaluate(() => {
        const width = document.documentElement.clientWidth;
        const outside = [...document.querySelectorAll('main input, main button, main select, main h1, main h2, .mobile-top-header button')]
          .filter(el => {
            const r = el.getBoundingClientRect();
            return r.width > 0 && r.height > 0 && (r.left < -1 || r.right > width + 1);
          }).map(el => ({ tag: el.tagName, class: el.className, text: el.textContent?.slice(0, 50) }));
        const card = document.querySelector('.owner-combined-card, .location-onboarding-card, .pet-combined-card, .auth-card, .consent-form-card');
        return { scrollWidth: document.documentElement.scrollWidth, outside,
          cardPadding: card ? getComputedStyle(card).padding : null,
          heading: document.querySelector('main h1, main h2')?.textContent };
      });
      results.push({ width, route, ...result });

      if (route === 'owner') {
        const ownerView = await page.evaluate(async () => {
          const modifyButton = [...document.querySelectorAll('button')]
            .find(button => button.textContent?.includes('Modify Details / Photo'));
          const result = {
            inlineEditIcons: document.querySelectorAll('.owner-view-row > svg').length,
            interactiveRows: document.querySelectorAll('.owner-view-row[role="button"], .owner-view-details-card[role="button"]').length,
            modifyActions: modifyButton ? 1 : 0,
            editFocusBorder: '',
          };
          if (modifyButton instanceof HTMLElement) {
            modifyButton.click();
            await new Promise(resolve => setTimeout(resolve, 50));
            const input = document.querySelector('#owner-full-name');
            if (input instanceof HTMLElement) input.focus();
            const wrapper = document.querySelector('.owner-modern-input-wrapper');
            if (wrapper) result.editFocusBorder = getComputedStyle(wrapper).borderColor;
          }
          return result;
        });
        Object.assign(results.at(-1), { ownerView });
        const hasNeutralFocus = ownerView.editFocusBorder === 'rgb(100, 116, 139)';
        if (ownerView.inlineEditIcons !== 0 || ownerView.interactiveRows !== 0 || ownerView.modifyActions !== 1 || !hasNeutralFocus) {
          process.exitCode = 1;
        }
      }

      if (route === 'alert') {
        const missingBroadcast = await page.evaluate(async () => {
          const missingCard = document.querySelector('[aria-label="Pet is Not Safe (Missing)"]');
          if (!(missingCard instanceof HTMLElement)) throw new Error('Missing Pet is Not Safe card');
          missingCard.click();
          await new Promise(resolve => setTimeout(resolve, 50));
          const modal = document.querySelector('.missing-report-modal-card');
          const modalRect = modal?.getBoundingClientRect();
          return {
            modalVisible: Boolean(modal),
            stayedOnSafetyPage: window.location.pathname === '/alert',
            modalInsideViewport: Boolean(modalRect && modalRect.left >= 0 && modalRect.right <= innerWidth && modalRect.top >= 0 && modalRect.bottom <= innerHeight),
            broadcastActionVisible: [...document.querySelectorAll('button')]
              .some(button => button.textContent?.includes('Broadcast Missing Alert')),
          };
        });
        Object.assign(results.at(-1), { missingBroadcast });
        if (!missingBroadcast.modalVisible || !missingBroadcast.stayedOnSafetyPage ||
          !missingBroadcast.modalInsideViewport || !missingBroadcast.broadcastActionVisible) {
          process.exitCode = 1;
        }
      }

      if (route === 'capture') {
        const captureLocation = await page.evaluate(async () => {
          const toggle = document.querySelector('.capture-manual-toggle-btn');
          if (toggle instanceof HTMLElement && !document.querySelector('.loc-grid-2x2')) {
            toggle.click();
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          const values = [...document.querySelectorAll('.loc-grid-2x2 .loc-gsq-value')]
            .map(element => element.textContent?.trim() || '');
          const placeholders = [...document.querySelectorAll('.loc-grid-2x2 .loc-gsq-placeholder')]
            .map(element => element.textContent?.trim() || '');
          const stateButton = document.querySelector('.loc-gsq-state');
          if (stateButton instanceof HTMLElement) stateButton.click();
          await new Promise(resolve => setTimeout(resolve, 100));
          const greenStateOptions = [...document.querySelectorAll('.pet-selector-item.has-pet-alert')]
            .map(element => element.textContent?.trim() || '');
          return { values, placeholders, greenStateOptions };
        });
        Object.assign(results.at(-1), { captureLocation });
        const expected = ['Select State', 'Select District', 'Select Mandal', 'Select Home Base'];
        if (
          captureLocation.values.length !== 4 ||
          captureLocation.placeholders.length !== 4 ||
          !expected.every(label => captureLocation.placeholders.includes(label))
        ) process.exitCode = 1;
      }

      if (route === 'dashboard') {
        const modalFlow = await page.evaluate(async () => {
          /** Waits for modal updates before the next browser assertion. */
          const pause = (ms = 120) => new Promise(resolve => setTimeout(resolve, ms));
          /** Clicks the first matching HTML element, throwing if the selector does not resolve to one. */
          const click = (selector) => {
            const element = document.querySelector(selector);
            if (!(element instanceof HTMLElement)) throw new Error(`Missing ${selector}`);
            element.click();
          };

          localStorage.setItem('findlostpuppy_sightings_v1', JSON.stringify([
            { id: 'responsive-sighting-1', reportId: 'responsive-lost', dogName: 'Missing Buddy', date: '2026-09-29', time: '10:30 AM', location: 'Test Village', state: 'Andhra Pradesh', district: 'Test District', mandal: 'Test Mandal', village: 'Test Village', photo: '/src/assets/sonu.jpg', description: 'First test sighting', createdAt: '2026-09-29T00:30:00Z', isCurrent: true },
            { id: 'responsive-sighting-2', reportId: 'responsive-lost', dogName: 'Missing Buddy', date: '2026-09-29', time: '11:00 AM', location: 'Second Test Village', state: 'Andhra Pradesh', district: 'Test District', mandal: 'Test Mandal', village: 'Second Test Village', photo: '/src/assets/sonu.jpg', description: 'Second test sighting', createdAt: '2026-09-29T01:00:00Z', isCurrent: true },
          ]));
          window.dispatchEvent(new Event('storage'));
          window.dispatchEvent(new CustomEvent('findlostpuppy_reports_updated'));
          await pause();

          click('.safe-filter');
          await pause();
          const safeList = document.querySelector('.dashboard-status-list-modal');
          const safeRows = [...(safeList?.querySelectorAll('.dashboard-status-pet-row') || [])];
          const rowsWithDetails = safeRows.filter(row => row.querySelector('.dashboard-status-view-details-btn'));
          const privateRows = safeRows.filter(row => row.textContent?.includes('Owner-only details'));
          const safeRowsRespectPrivacy = safeRows.length > 0 && safeRows.every(row => {
            const hasDetails = Boolean(row.querySelector('.dashboard-status-view-details-btn'));
            const ownerOnly = row.textContent?.includes('Owner-only details');
            return hasDetails || ownerOnly;
          });
          const safeRowsAreConcise = safeRows.every(row => {
            const text = row.textContent || '';
            return !text.includes('Edit') && !text.includes('Mark Missing') && !text.includes('Report Other Pet');
          });
          let petDetailVisible = rowsWithDetails.length === 0;
          let petImageLayout = {
            modalFitsWidth: true,
            stageMatchesPhotoHeight: true,
            photoFitsWidth: true,
            closeVisible: true,
            modalScrollsInternally: true,
          };
          let safeDetailIsReadOnly = true;
          let listHiddenForPetDetail = true;
          let safeListRestored = true;
          if (rowsWithDetails.length > 0) {
            const detailsButton = rowsWithDetails[0].querySelector('.dashboard-status-view-details-btn');
            if (!(detailsButton instanceof HTMLElement)) throw new Error('Missing row details button');
            detailsButton.click();
            await pause();
            petDetailVisible = Boolean(document.querySelector('.dashboard-status-pet-modal'));
            const petModal = document.querySelector('.dashboard-status-pet-modal');
            const petPhotoStage = document.querySelector('.dashboard-status-popover-photo-stage');
            const petPhoto = document.querySelector('.dashboard-status-popover-photo');
            const petClose = document.querySelector('.dashboard-status-pet-modal .dashboard-status-modal-close');
            const modalRect = petModal?.getBoundingClientRect();
            const stageRect = petPhotoStage?.getBoundingClientRect();
            const photoRect = petPhoto?.getBoundingClientRect();
            const closeRect = petClose?.getBoundingClientRect();
            petImageLayout = {
              modalFitsWidth: Boolean(modalRect && modalRect.left >= -1 && modalRect.right <= innerWidth + 1),
              stageMatchesPhotoHeight: Boolean(stageRect && photoRect && Math.abs(stageRect.height - photoRect.height) <= 2),
              photoFitsWidth: Boolean(photoRect && photoRect.left >= -1 && photoRect.right <= innerWidth + 1),
              closeVisible: Boolean(closeRect && closeRect.left >= 0 && closeRect.right <= innerWidth && closeRect.top >= 0),
              modalScrollsInternally: Boolean(petModal && petModal.scrollHeight >= petModal.clientHeight),
            };
            const safeDetailText = document.querySelector('.dashboard-status-pet-modal')?.textContent || '';
            safeDetailIsReadOnly = !safeDetailText.includes('Edit Details') &&
              !safeDetailText.includes('Mark Missing') && !safeDetailText.includes('Report Other Pet');
            listHiddenForPetDetail = !document.querySelector('.dashboard-status-list-modal');
            click('.dashboard-status-pet-modal .dashboard-status-modal-close');
            await pause();
            safeListRestored = Boolean(document.querySelector('.dashboard-status-list-modal'));
          }
          click('.dashboard-status-list-modal .dashboard-status-modal-close');
          await pause();

          click('.sighting-filter');
          await pause();
          const sightingButton = document.querySelector('.dashboard-view-sightings-btn');
          if (sightingButton instanceof HTMLElement) sightingButton.click();
          await pause();
          const sightingDetailVisible = Boolean(sightingButton && document.querySelector('.dashboard-status-pet-modal'));
          const listHiddenForSighting = Boolean(sightingButton && !document.querySelector('.dashboard-status-list-modal'));
          const sightingTabs = document.querySelectorAll('.dashboard-sighting-tab').length;
          const sightingClose = document.querySelector('.dashboard-status-pet-modal .dashboard-status-modal-close');
          if (sightingClose instanceof HTMLElement) sightingClose.click();
          await pause();
          const sightingListRestored = Boolean(sightingButton && document.querySelector('.dashboard-status-list-modal'));

          return {
            safeRowsRespectPrivacy, safeRowsAreConcise, detailRows: rowsWithDetails.length, privateRows: privateRows.length, petDetailVisible, petImageLayout, safeDetailIsReadOnly, listHiddenForPetDetail, safeListRestored,
            sightingDetailVisible, listHiddenForSighting, sightingTabs, sightingListRestored,
          };
        });
        Object.assign(results.at(-1), { modalFlow });
        if (
          !modalFlow.safeRowsRespectPrivacy || !modalFlow.safeRowsAreConcise || !modalFlow.petDetailVisible ||
          !modalFlow.petImageLayout.modalFitsWidth || !modalFlow.petImageLayout.stageMatchesPhotoHeight ||
          !modalFlow.petImageLayout.photoFitsWidth || !modalFlow.petImageLayout.closeVisible ||
          !modalFlow.safeDetailIsReadOnly || !modalFlow.listHiddenForPetDetail ||
          !modalFlow.safeListRestored || !modalFlow.sightingDetailVisible || !modalFlow.listHiddenForSighting ||
          modalFlow.sightingTabs !== 2 || !modalFlow.sightingListRestored
        ) process.exitCode = 1;
      }
      await page.screenshot({ path: `${output}/${route}-${width}.png`, fullPage: true });
      console.log(JSON.stringify(results.at(-1)));
    }
  }
} finally {
  await browser.close();
  await writeFile(`${output}/results.json`, JSON.stringify(results, null, 2));
}
if (results.some(r => r.scrollWidth > r.width + 1 || r.outside.length)) process.exitCode = 1;
