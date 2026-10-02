import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import assert from 'node:assert/strict';

const chromePaths = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
];
const executablePath = chromePaths.find((p) => fs.existsSync(p));
const artifactDir = '/Users/jayakrishna/.gemini/antigravity-ide/brain/14a5c867-efb6-4e2c-b19b-304469980ec9';

async function run() {
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,800'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  console.log('\n--- SCENARIO 1: Unauthenticated user visits root "/" ---');
  await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 600));

  const s1 = await page.evaluate(() => {
    return {
      hasSignIn: document.body.innerText.includes('Continue with Google') || document.body.innerText.includes('Sign in with Google'),
      hasConsent: document.body.innerText.includes('Community Safety Agreement') || document.body.innerText.includes('Review the 4 forms'),
      hasServerNotice: !!document.querySelector('.server-failure-notice'),
      url: window.location.href,
    };
  });
  console.log('Scenario 1 result:', s1);
  assert.equal(s1.hasSignIn, true, 'Must show Sign In page');
  assert.equal(s1.hasConsent, false, 'Must NOT show ConsentPage');
  assert.equal(s1.hasServerNotice, false, 'Must NOT show ServerFailureNotice');
  await page.screenshot({ path: path.join(artifactDir, 'verify_scenario1_unauth_signin.png') });

  console.log('\n--- SCENARIO 2: Unauthenticated user directly navigates to "/consent" ---');
  await page.goto('http://localhost:5173/consent', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 600));

  const s2 = await page.evaluate(() => {
    return {
      hasSignIn: document.body.innerText.includes('Continue with Google') || document.body.innerText.includes('Sign in with Google'),
      hasConsent: document.body.innerText.includes('Community Safety Agreement'),
      pathname: window.location.pathname,
    };
  });
  console.log('Scenario 2 result:', s2);
  assert.equal(s2.hasSignIn, true, 'Unauthenticated user at /consent must be redirected to sign in');
  assert.equal(s2.hasConsent, false, 'Must NOT show consent form');

  console.log('\n--- SCENARIO 3: Returning user signs in / visits app ---');
  await page.evaluate(() => {
    const returningUser = {
      id: 'returning_parent_99',
      email: 'returning@example.com',
      name: 'Returning Parent',
      isAdmin: false,
    };
    sessionStorage.setItem('findlostpuppy_launch_seen', 'true');
    localStorage.setItem('findlostpuppy_active_user', JSON.stringify(returningUser));
    localStorage.setItem('findlostpuppy_current_user_v1', JSON.stringify(returningUser));
    // User already completed profile & has accepted consent previously
    localStorage.setItem('findlostpuppy_returning_user_returning_parent_99', 'true');
    localStorage.setItem('findlostpuppy_consent_accepted_returning_parent_99', 'true');
    localStorage.setItem('findlostpuppy_has_accepted_consent', 'true');
    localStorage.setItem('findlostpuppy_profiles_v1', JSON.stringify([{
      id: 'returning_parent_99',
      userId: 'returning_parent_99',
      fullName: 'Returning Parent',
      phone: '9876543210',
      email: 'returning@example.com',
      city: 'Hyderabad',
      district: 'Hyderabad',
    }]));
  });

  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 800));

  const s3 = await page.evaluate(() => {
    return {
      hasConsent: document.body.innerText.includes('Community Safety Agreement') || document.body.innerText.includes('Review the 4 forms'),
      hasServerNotice: !!document.querySelector('.server-failure-notice'),
      url: window.location.href,
    };
  });
  console.log('Scenario 3 result (Root for returning user):', s3);
  assert.equal(s3.hasConsent, false, 'Returning user must completely skip consent');
  assert.equal(s3.hasServerNotice, false, 'No error notice');

  // Even if returning user tries to open /consent directly:
  await page.goto('http://localhost:5173/consent', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 600));

  const s3ConsentUrl = await page.evaluate(() => {
    return {
      hasConsent: document.body.innerText.includes('Community Safety Agreement') || document.body.innerText.includes('Review the 4 forms'),
      pathname: window.location.pathname,
    };
  });
  console.log('Scenario 3 result (Direct /consent navigation):', s3ConsentUrl);
  assert.equal(s3ConsentUrl.hasConsent, false, 'Returning user visiting /consent directly must be redirected away');
  await page.screenshot({ path: path.join(artifactDir, 'verify_scenario3_returning_bypasses_consent.png') });

  console.log('\n--- SCENARIO 4: First-time user signs in, accepts consent, never sees it again ---');
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
    const newUser = {
      id: 'brand_new_user_123',
      email: 'newuser123@example.com',
      name: 'Fresh Newbie',
      isAdmin: false,
    };
    sessionStorage.setItem('findlostpuppy_launch_seen', 'true');
    localStorage.setItem('findlostpuppy_active_user', JSON.stringify(newUser));
    localStorage.setItem('findlostpuppy_current_user_v1', JSON.stringify(newUser));
  });

  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 600));

  const s4Initial = await page.evaluate(() => {
    return {
      hasConsent: document.body.innerText.includes('Community Safety Agreement') || document.body.innerText.includes('Review the 4 forms'),
      hasServerNotice: !!document.querySelector('.server-failure-notice'),
      pathname: window.location.pathname,
    };
  });
  console.log('Scenario 4 Initial (First time user after sign in):', s4Initial);
  assert.equal(s4Initial.hasConsent, true, 'First-time user must see consent on initial post-login');
  assert.equal(s4Initial.hasServerNotice, false, 'Server failure notice must NOT show on consent page');
  await page.screenshot({ path: path.join(artifactDir, 'verify_scenario4_first_time_sees_consent.png') });

  // Click "Accept All 4 Forms & Continue"
  console.log('Clicking Accept All 4 Forms & Continue button...');
  await page.evaluate(() => {
    const btn = document.getElementById('agree-continue-button') || document.querySelector('.btn-agree-continue');
    if (btn) btn.click();
  });
  await new Promise((r) => setTimeout(r, 800));

  const s4AfterAccept = await page.evaluate(() => {
    return {
      hasConsent: document.body.innerText.includes('Community Safety Agreement') || document.body.innerText.includes('Review the 4 forms'),
      pathname: window.location.pathname,
    };
  });
  console.log('Scenario 4 After Accept:', s4AfterAccept);
  assert.equal(s4AfterAccept.hasConsent, false, 'Consent must disappear immediately after accepting');
  assert.equal(s4AfterAccept.pathname, '/owner', 'Must transition to owner page');

  // Verify reload does NOT bring back consent
  console.log('Reloading page to verify consent never reappears...');
  await page.reload({ waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 800));

  const s4AfterReload = await page.evaluate(() => {
    return {
      hasConsent: document.body.innerText.includes('Community Safety Agreement') || document.body.innerText.includes('Review the 4 forms'),
      pathname: window.location.pathname,
    };
  });
  console.log('Scenario 4 After Reload:', s4AfterReload);
  assert.equal(s4AfterReload.hasConsent, false, 'Consent must NEVER reappear on reload');
  assert.equal(s4AfterReload.pathname, '/owner', 'Must stay on owner onboarding page');
  await page.screenshot({ path: path.join(artifactDir, 'verify_scenario4_after_accept_owner.png') });

  await browser.close();
  console.log('\n🎉 ALL 4 USER SCENARIOS VERIFIED 100% SUCCESSFULLY!\n');
}

run().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
