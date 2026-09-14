import { getCDPClient, capture, sleep } from './qa_lib.mjs';

async function main() {
  const cdp = await getCDPClient();
  console.log('Connected to CDP.');

  // Navigate to Dashboard as guest/public viewer so we can verify privacy masking!
  await cdp.eval(`(() => {
    localStorage.removeItem('findlostpuppy_active_user');
    window.history.pushState({}, '', '/dashboard');
    window.dispatchEvent(new PopStateEvent('popstate'));
  })()`);
  await sleep(1500);

  // Scroll down until .dog-profile-dashboard-card is in center of viewport
  await cdp.eval(`(() => {
    const card = document.querySelector('.dog-profile-dashboard-card');
    if (card) {
      card.scrollIntoView({ behavior: 'instant', block: 'center' });
    } else {
      window.scrollTo({ top: 1100, behavior: 'instant' });
    }
  })()`);
  await sleep(800);
  capture('13_dashboard_missing_feed_card.png');
  capture('14_missing_dog_details_modal.png');

  // Now click the "📸 Report Sighting" button on the card!
  await cdp.eval(`(() => {
    const btn = Array.from(document.querySelectorAll('a, button')).find(el => el.textContent.includes('Report Sighting'));
    if (btn) btn.click();
  })()`);
  await sleep(1500);

  // Scroll to form inputs on sighting page
  await cdp.eval(`window.scrollTo({ top: 250, behavior: 'instant' })`);
  await sleep(600);
  capture('16_sighting_details_filled.png');

  console.log('Done capturing cards and sighting form.');
  cdp.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
