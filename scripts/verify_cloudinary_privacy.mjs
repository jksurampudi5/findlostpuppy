import fs from 'node:fs';

const service = fs.readFileSync('src/services/storageBucketService.ts', 'utf8');
const backend = fs.readFileSync('worker/index.ts', 'utf8');
const envExample = fs.readFileSync('.env.example', 'utf8');

const failures = [];
const requireText = (condition, message) => { if (!condition) failures.push(message); };

requireText(!service.includes('VITE_CLOUDINARY_API_SECRET'), 'Cloudinary API secret reference exists in client service.');
requireText(!service.includes('VITE_CLOUDINARY_API_KEY'), 'Cloudinary API key reference exists in client service.');
requireText(!service.includes("formData.append('upload_preset'"), 'Unsigned Cloudinary upload path remains in the client.');
requireText(!envExample.includes('VITE_CLOUDINARY_PUBLIC_UPLOAD_PRESET'), 'Unsigned Cloudinary preset remains documented.');
requireText(backend.includes("type: 'authenticated'"), 'Uploads are not restricted to authenticated delivery.');
requireText(backend.includes('jwtVerify'), 'Worker does not verify Firebase authentication tokens.');
requireText(backend.includes('ownedBy(publicId, uid)'), 'Cloudinary ownership validation is missing.');
requireText(backend.includes('invalidate: true'), 'Cloudinary cache invalidation is missing from deletion.');
requireText(backend.includes("'/account/media-cleanup'"), 'Authenticated account-media deletion is missing.');
requireText(backend.includes("'/media/reset'"), 'Cloudinary hard reset is missing.');

if (failures.length) {
  console.error(failures.map((failure) => `- ${failure}`).join('\n'));
  process.exit(1);
}

console.log('Cloudinary authenticated-media and deletion contracts verified.');
