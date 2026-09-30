import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [rules, storageRules, syncService, manifest, missingModal, guestSighting] = await Promise.all([
  readFile(new URL('../firebase.firestore.rules', import.meta.url), 'utf8'),
  readFile(new URL('../firebase.storage.rules', import.meta.url), 'utf8'),
  readFile(new URL('../src/services/firebaseSyncService.ts', import.meta.url), 'utf8'),
  readFile(new URL('../android/app/src/main/AndroidManifest.xml', import.meta.url), 'utf8'),
  readFile(new URL('../src/components/MissingPetReportModal.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/pages/GuestSightingPage.tsx', import.meta.url), 'utf8'),
]);

assert.match(rules, /match \/pets\/\{userId\}[\s\S]*?allow read: if owns\(userId\) \|\| isAdmin\(\);/);
assert.match(rules, /data\.status == 'LOST' && sharedReportIsSanitized\(data\)/);
assert.match(rules, /match \/missing_reports\/\{userId\}[\s\S]*?allow read: if owns\(userId\) \|\| isAdmin\(\) \|\| \(signedIn\(\) && isPublicLostReport\(resource\.data\)\);/);
assert.doesNotMatch(rules, /match \/pets\/\{userId\}[\s\S]*?allow read: if signedIn\(\);/);

assert.match(syncService, /getDoc\(doc\(db, 'pets', currentUser\.uid\)\)/);
assert.match(syncService, /getDoc\(doc\(db, 'missing_reports', currentUser\.uid\)\)/);
assert.match(syncService, /doc\(db, 'missing_reports', currentUser\.uid\)[\s\S]*?status: isLost \? 'LOST' : 'SAFE'/);
assert.match(syncService, /where\('status', '==', 'LOST'\)/);
for (const field of [
  'contactMechanism.safeContactPhone',
  'contactMechanism.safeContactEmail',
  'contactMechanism.contactNote',
  'lastKnownLatitude',
  'lastKnownLongitude',
]) {
  assert.ok(syncService.includes(`where('${field}', '==',`), `Missing shared-report privacy query for ${field}`);
}

for (const path of ['users', 'profiles', 'pets']) {
  const escapedPath = path === 'pets' ? `${path}\\/\\{userId\\}\\/\\{path=\\*\\*\\}` : `${path}\\/\\{userId\\}\\/\\{fileName\\}`;
  assert.match(
    storageRules,
    new RegExp(`match \\/${escapedPath} \\{[\\s\\S]*?allow read: if signedIn\\(\\) && \\(request\\.auth\\.uid == userId \\|\\| isAdmin\\(\\)\\);`),
  );
}
assert.match(manifest, /android:allowBackup="false"/);
assert.doesNotMatch(missingModal, /GPS:\s*\$\{geo\.latitude|GPS \(\$\{geo\.latitude/);
assert.doesNotMatch(guestSighting, /GPS:\s*\$\{geo\.latitude/);

console.log('Firebase, location, and Android privacy contracts verified.');
