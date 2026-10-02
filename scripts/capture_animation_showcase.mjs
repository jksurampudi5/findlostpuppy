import puppeteer from 'puppeteer-core';
import path from 'path';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const ARTIFACTS_DIR = '/Users/jayakrishna/.gemini/antigravity-ide/brain/14a5c867-efb6-4e2c-b19b-304469980ec9';

async function captureDemo() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,1000'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 1000 });

  await page.evaluateOnNewDocument(() => {
    sessionStorage.setItem('findlostpuppy_launch_seen', 'true');
    localStorage.setItem('findlostpuppy_launch_seen', 'true');
  });

  // Navigate to /demo
  console.log('Navigating to http://localhost:5173/demo ...');
  await page.goto('http://localhost:5173/demo', { waitUntil: 'networkidle2' });

  // Screenshot 1: Overview with Option 1
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'animation_showcase_option1.png'), fullPage: true });
  console.log('Captured Option 1 overview screenshot');

  // Click Option 2
  const optBtns = await page.$$('.option-card-btn');
  if (optBtns.length >= 2) {
    await optBtns[1].click();
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'animation_showcase_option2.png'), fullPage: false });
    console.log('Captured Option 2 screenshot');
  }

  // Click Option 3
  if (optBtns.length >= 3) {
    await optBtns[2].click();
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'animation_showcase_option3.png'), fullPage: false });
    console.log('Captured Option 3 screenshot');
  }

  // Click Option 4
  if (optBtns.length >= 4) {
    await optBtns[3].click();
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'animation_showcase_option4.png'), fullPage: false });
    console.log('Captured Option 4 screenshot');
  }

  // Scroll to Loading Button Lab & trigger a button
  await page.evaluate(() => {
    window.scrollTo({ top: 900, behavior: 'instant' });
  });
  await new Promise(r => setTimeout(r, 400));
  const labBtns = await page.$$('.button-lab-card button');
  if (labBtns.length >= 1) {
    await labBtns[0].click();
    await new Promise(r => setTimeout(r, 200)); // during load gap
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'animation_showcase_button_loading_gap.png') });
    console.log('Captured Button Loading Gap screenshot');
  }

  await browser.close();
  console.log('Puppeteer capture finished successfully!');
}

captureDemo().catch((err) => {
  console.error(err);
  process.exit(1);
});
