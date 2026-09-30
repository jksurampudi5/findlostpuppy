import puppeteer from 'puppeteer-core';

const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});
const baseUrl = process.env.FINDLOSTPUPPY_TEST_URL || 'http://127.0.0.1:5173';

try {
  const page = await browser.newPage();
  const results = [];
  for (const viewport of [
    { width: 360, height: 640 },
    { width: 375, height: 667 },
    { width: 390, height: 844 },
    { width: 412, height: 915 },
    { width: 430, height: 932 },
    { width: 844, height: 390 },
    { width: 768, height: 1024 },
  ]) {
    await page.setViewport({ ...viewport, isMobile: viewport.width < 500, hasTouch: true });
    await page.goto(`${baseUrl}/consent`, { waitUntil: 'networkidle0' });
    await page.evaluate(() => sessionStorage.setItem('findlostpuppy_launch_seen', 'true'));
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#adult-age-confirmation-checkbox', { timeout: 10000 });
    results.push(await page.evaluate(() => ({
      viewport: `${innerWidth}x${innerHeight}`,
      overflow: document.documentElement.scrollWidth > innerWidth,
      ageGate: Boolean(document.querySelector('#adult-age-confirmation-checkbox')),
    })));
  }

  await page.setOfflineMode(true);
  await page.evaluate(() => window.dispatchEvent(new Event('offline')));
  await new Promise((resolve) => setTimeout(resolve, 200));
  const offline = await page.evaluate(() => ({
    visible: Boolean(document.querySelector('.fallback-shell--fullscreen')),
    text: document.querySelector('.fallback-shell--fullscreen')?.textContent?.trim(),
    overflow: document.documentElement.scrollWidth > innerWidth,
  }));

  await page.setOfflineMode(false);
  await page.evaluate(() => window.dispatchEvent(new Event('online')));
  await new Promise((resolve) => setTimeout(resolve, 200));
  const reconnected = await page.evaluate(() =>
    Boolean(document.querySelector('.network-status-banner.is-online'))
  );

  await page.evaluate(() => window.dispatchEvent(new CustomEvent('findlostpuppy_cloud_sync_failed')));
  await new Promise((resolve) => setTimeout(resolve, 100));
  const serverFailure = await page.evaluate(() => ({
    visible: Boolean(document.querySelector('.server-failure-notice')),
    retry: Array.from(document.querySelectorAll('.server-failure-notice button')).some((button) => button.textContent?.includes('Retry')),
    overflow: document.documentElement.scrollWidth > innerWidth,
  }));

  await page.goto(`${baseUrl}/?forceErrorBoundary=1`, { waitUntil: 'domcontentloaded' });
  const errorBoundary = await page.evaluate(() => ({
    visible: Boolean(document.querySelector('.fallback-shell--fullscreen')),
    retry: Array.from(document.querySelectorAll('button')).some((button) => button.textContent?.includes('Retry')),
    home: Array.from(document.querySelectorAll('button')).some((button) => button.textContent?.includes('Go to Home')),
    technicalDetailsVisible: document.body.textContent?.includes('Intentional development-only') || false,
    overflow: document.documentElement.scrollWidth > innerWidth,
  }));

  console.log(JSON.stringify({ results, offline, reconnected, serverFailure, errorBoundary }, null, 2));
  if (
    results.some((result) => result.overflow || !result.ageGate) ||
    !offline.visible || !reconnected || !serverFailure.visible || !serverFailure.retry || serverFailure.overflow ||
    !errorBoundary.visible || !errorBoundary.retry ||
    !errorBoundary.home || errorBoundary.technicalDetailsVisible || errorBoundary.overflow
  ) {
    process.exitCode = 1;
  }
} finally {
  await browser.close();
}
