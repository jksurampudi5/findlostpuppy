import puppeteer from 'puppeteer-core';
import path from 'path';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const ARTIFACTS_DIR = '/Users/jayakrishna/.gemini/antigravity-ide/brain/14a5c867-efb6-4e2c-b19b-304469980ec9';

async function testTransition() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,900'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  // Set auth & consent & launch_seen so user is directly in app
  await page.evaluateOnNewDocument(() => {
    sessionStorage.setItem('findlostpuppy_launch_seen', 'true');
    localStorage.setItem('findlostpuppy_launch_seen', 'true');
    const mockUser = {
      id: 'usr_test_123',
      email: 'jayakrishna.jk14@gmail.com',
      name: 'Jayakrishna',
      phone: '9876543210',
      isAdmin: true,
    };
    localStorage.setItem('findlostpuppy_active_user', JSON.stringify(mockUser));
    localStorage.setItem('findlostpuppy_current_user_v1', JSON.stringify(mockUser));
    localStorage.setItem('findlostpuppy_consent_v1', JSON.stringify({
      agreed: true,
      timestamp: Date.now(),
      consentVersion: '1.1',
      termsAgreed: true,
      disclaimerAgreed: true,
      guidelinesAgreed: true,
      privacyAgreed: true,
    }));
    const mockProfile = {
      id: 'usr_test_123',
      userId: 'usr_test_123',
      fullName: 'Jayakrishna',
      phone: '9876543210',
      email: 'jayakrishna.jk14@gmail.com',
      preferredContact: 'phone',
      hasLocationConsent: true,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem('findlostpuppy_profiles_v1', JSON.stringify([mockProfile]));
    localStorage.setItem('findlostpuppy_owner_profile_usr_test_123', JSON.stringify(mockProfile));
    localStorage.setItem('findlostpuppy_owner_profile', JSON.stringify(mockProfile));
  });

  console.log('Navigating to http://localhost:5173/owner ...');
  await page.goto('http://localhost:5173/owner', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 600));

  // Find Continue to Location button
  const continueBtn = await page.$('.continue-to-location-orange-btn');
  if (continueBtn) {
    console.log('Clicking Continue to Location button...');
    await continueBtn.click();
    
    // Screenshot 1: In the middle (interstitial loading animation active!)
    await new Promise(r => setTimeout(r, 400));
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'interstitial_transition_in_middle.png') });
    console.log('Captured interstitial transition loading screen!');

    // Wait for transition to complete (duration is 1500ms)
    await new Promise(r => setTimeout(r, 1600));
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'interstitial_transition_landed_location.png') });
    console.log('Captured location page landed screenshot!');
  } else {
    console.log('Could not find continue button, checking form view...');
  }

  await browser.close();
}

testTransition().catch((err) => {
  console.error(err);
  process.exit(1);
});
