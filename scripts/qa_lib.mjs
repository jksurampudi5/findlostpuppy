import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const SCREENSHOT_DIR = '/Users/jayakrishna/.gemini/antigravity-ide/brain/cab227a9-7293-4978-80ff-e8b95086102c/qa_screenshots';

if (!existsSync(SCREENSHOT_DIR)) {
  mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

export function capture(filename) {
  const fullPath = join(SCREENSHOT_DIR, filename);
  execSync(`adb exec-out screencap -p > "${fullPath}"`);
  console.log(`📸 Captured: ${filename}`);
  return fullPath;
}

export function backKey() {
  execSync('adb shell input keyevent 4');
  console.log('🔙 Issued Android Back Key (KeyEvent 4)');
}

export class CDPClient {
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
      returnByValue: true
    });
    if (result?.exceptionDetails) {
      console.error('CDP Eval Exception:', JSON.stringify(result.exceptionDetails));
    }
    return result?.result?.value;
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

export async function getCDPClient() {
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

export function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}
