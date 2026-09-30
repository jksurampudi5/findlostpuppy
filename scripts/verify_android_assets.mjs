import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const androidPublicDir = path.join(rootDir, 'android', 'app', 'src', 'main', 'assets', 'public');
const indexPath = path.join(androidPublicDir, 'index.html');

console.log('🔍 Validating Android native assets in:', androidPublicDir);

if (!fs.existsSync(indexPath)) {
  console.error('❌ FAIL: android assets public/index.html does not exist!');
  process.exit(1);
}

const html = fs.readFileSync(indexPath, 'utf-8');

// Check 1: Ensure no /findlostpuppy/ subpath exists
if (html.includes('/findlostpuppy/')) {
  console.error('❌ FAIL: index.html contains GitHub Pages subpath "/findlostpuppy/"! This causes 404 and black screen on Android.');
  process.exit(1);
}

// Check 2: Verify referenced script and css files actually exist
const assetMatches = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)];
if (assetMatches.length === 0) {
  console.error('❌ FAIL: No asset bundles found in index.html!');
  process.exit(1);
}

for (const match of assetMatches) {
  const assetPath = match[1];
  const relativeFile = assetPath.replace(/^\//, '');
  const fullFilePath = path.join(androidPublicDir, relativeFile);
  if (!fs.existsSync(fullFilePath)) {
    console.error(`❌ FAIL: Asset referenced in index.html does not exist on disk: ${assetPath} -> ${fullFilePath}`);
    process.exit(1);
  }
  console.log(`  ✓ Verified asset exists: ${assetPath} (${(fs.statSync(fullFilePath).size / 1024).toFixed(1)} KB)`);
}

console.log('✅ PASS: All Android web assets are correctly rooted and verified!');
