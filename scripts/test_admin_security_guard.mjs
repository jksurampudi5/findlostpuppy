import puppeteer from 'puppeteer-core';

const chromePath = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

async function testSecurity() {
  console.log('Testing AdminShortcuts access control security guard...');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  // TEST 1: Plain user (non-admin)
  console.log('Case 1: Plain user (regularuser@example.com)...');
  await page.goto('http://localhost:5173/shortcuts', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    localStorage.setItem('findlostpuppy_active_user', JSON.stringify({
      id: 'plain-user-1',
      email: 'regularuser@example.com',
      name: 'Regular Pet Parent',
      isAdmin: false
    }));
    localStorage.setItem('findlostpuppy_consent_agreed_v1', 'true');
    localStorage.setItem('findlostpuppy_launch_seen', 'true');
    sessionStorage.setItem('findlostpuppy_launch_seen', 'true');
  });

  await page.goto('http://localhost:5173/shortcuts', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));

  const pageText = await page.evaluate(() => document.body.innerText);
  if (!pageText.includes('Administrator Access Required')) {
    throw new Error('FAILED: Plain user was able to bypass admin check on /shortcuts!');
  }
  if (pageText.includes('Product Requirements Document') || pageText.includes('Firestore Security Rules')) {
    throw new Error('FAILED: Sensitive documents or rules leaked to plain user!');
  }
  console.log('✅ Case 1 Passed: Plain user successfully blocked with Administrator Access Required screen');

  // TEST 2: Authorized Admin
  console.log('Case 2: Authorized Admin (jksurampudi5@gmail.com)...');
  await page.evaluate(() => {
    localStorage.setItem('findlostpuppy_active_user', JSON.stringify({
      id: 'admin-user-1',
      email: 'jksurampudi5@gmail.com',
      name: 'Jaya Krishna',
      isAdmin: true
    }));
    localStorage.setItem('findlostpuppy_consent_agreed_v1', 'true');
    localStorage.setItem('findlostpuppy_launch_seen', 'true');
    sessionStorage.setItem('findlostpuppy_launch_seen', 'true');
  });

  await page.goto('http://localhost:5173/shortcuts', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));

  const adminPageText = await page.evaluate(() => document.body.innerText);
  if (!adminPageText.includes('FindLostPuppy Admin Shortcuts')) {
    throw new Error('FAILED: Authorized admin was blocked from /shortcuts!');
  }
  if (!adminPageText.includes('Navigation Flow') || !adminPageText.includes('Official Documents & PDFs')) {
    throw new Error('FAILED: Admin dashboard did not load correctly for admin!');
  }
  console.log('✅ Case 2 Passed: Authorized Admin successfully granted full access');

  await browser.close();
  console.log('🎉 All security access control tests passed!');
}

testSecurity().catch(err => {
  console.error(err);
  process.exit(1);
});
