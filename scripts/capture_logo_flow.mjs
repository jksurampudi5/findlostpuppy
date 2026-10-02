import puppeteer from 'puppeteer-core';
import path from 'path';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const ARTIFACTS_DIR = '/Users/jayakrishna/.gemini/antigravity-ide/brain/14a5c867-efb6-4e2c-b19b-304469980ec9';

async function captureLogoTransition() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,900'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  await page.evaluateOnNewDocument(() => {
    sessionStorage.setItem('findlostpuppy_launch_seen', 'true');
    localStorage.setItem('findlostpuppy_launch_seen', 'true');
  });

  console.log('Navigating to http://localhost:5173/demo ...');
  await page.goto('http://localhost:5173/demo', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 600));

  // Find the Play Forward button
  const forwardBtn = await page.$('button ::-p-text(Play Forward)');
  if (forwardBtn) {
    console.log('Clicking Play Forward...');
    await forwardBtn.click();
    // Wait for puppy to unleash and be running mid-road
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'logo_flow_forward_running.png') });
    console.log('Captured logo_flow_forward_running.png');

    // Wait for forward to finish
    await new Promise(r => setTimeout(r, 1400));
  }

  // Find the Play Backward button
  const backwardBtn = await page.$('button ::-p-text(Play Backward)');
  if (backwardBtn) {
    console.log('Clicking Play Backward...');
    await backwardBtn.click();
    // Wait for puppy to be running back
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'logo_flow_backward_returning.png') });
    console.log('Captured logo_flow_backward_returning.png');
  }

  await browser.close();
  console.log('All captures done!');
}

captureLogoTransition().catch((err) => {
  console.error(err);
  process.exit(1);
});
