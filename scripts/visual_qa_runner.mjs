import { execSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const SCREENSHOT_DIR = '/Users/jayakrishna/.gemini/antigravity-ide/brain/cab227a9-7293-4978-80ff-e8b95086102c/qa_screenshots';

if (!existsSync(SCREENSHOT_DIR)) {
  mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

function captureScreenshot(filename) {
  const fullPath = join(SCREENSHOT_DIR, filename);
  execSync(`adb exec-out screencap -p > "${fullPath}"`);
  console.log(`📸 Captured: ${filename}`);
  return fullPath;
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.msgId = 1;
    this.pending = new Map();
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = (err) => reject(err);
      this.ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.id && this.pending.has(data.id)) {
          const { resolve, reject } = this.pending.get(data.id);
          this.pending.delete(data.id);
          if (data.error) reject(data.error);
          else resolve(data.result);
        }
      };
    });
  }

  async send(method, params = {}) {
    const id = this.msgId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async eval(expression) {
    const result = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    if (result.exceptionDetails) {
      throw new Error(JSON.stringify(result.exceptionDetails));
    }
    return result.result?.value;
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

async function getCDPClient() {
  // Ensure adb forward
  const pid = execSync('adb shell pidof com.findlostpuppy.app').toString().trim();
  execSync(`adb forward tcp:9222 localabstract:webview_devtools_remote_${pid}`);
  const res = await fetch('http://localhost:9222/json/list');
  const targets = await res.json();
  const pageTarget = targets.find(t => t.type === 'page');
  if (!pageTarget) throw new Error('No page target found');
  const client = new CDPClient(pageTarget.webSocketDebuggerUrl);
  await client.connect();
  return client;
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  const cdp = await getCDPClient();
  console.log('Connected to Android WebView via CDP');

  // Check current URL
  const url = await cdp.eval('window.location.href');
  console.log('Current URL:', url);

  // FLOW 2: Pre-auth Consent Checkboxes & Agree
  console.log('\n--- Checking Consent Page ---');
  await cdp.eval('window.scrollTo(0, document.body.scrollHeight)');
  await sleep(600);
  captureScreenshot('02_consent_bottom_agreed_state.png');

  // Check checkboxes
  const checkboxesChecked = await cdp.eval(`(() => {
    const boxes = Array.from(document.querySelectorAll('input[type="checkbox"]'));
    boxes.forEach(b => {
      if (!b.checked) b.click();
    });
    return boxes.length;
  })()`);
  console.log('Checked checkboxes count:', checkboxesChecked);
  await sleep(400);
  captureScreenshot('02_consent_all_checked.png');

  // Click Agree & Continue button
  const agreed = await cdp.eval(`(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Agree & Continue') || b.textContent.includes('Accept & Continue') || b.textContent.includes('Accept'));
    if (btn) {
      btn.click();
      return btn.textContent.trim();
    }
    return null;
  })()`);
  console.log('Clicked consent button:', agreed);
  await sleep(1000);

  // Check current URL after consent
  const afterConsentUrl = await cdp.eval('window.location.href');
  console.log('URL after consent:', afterConsentUrl);
  captureScreenshot('03_login_page_initial.png');

  cdp.close();
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
