import { v2 as cloudinary } from 'cloudinary';

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;
const confirmed = process.argv.includes('--confirm-delete-all');

if (!cloudName || !apiKey || !apiSecret) {
  console.error('Missing CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, or CLOUDINARY_API_SECRET.');
  process.exit(1);
}

if (cloudName !== 'ymrxc4mq') {
  console.error('Cloud name does not match the reviewed FindLostPuppy Cloudinary environment.');
  process.exit(1);
}

if (!confirmed) {
  console.error('Deletion cancelled. Re-run with --confirm-delete-all after reviewing the command.');
  process.exit(1);
}

cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true });

/** Counts image assets across all resource pages for the supplied Cloudinary delivery type. */
async function countImages(type) {
  let count = 0;
  let nextCursor;
  do {
    const result = await cloudinary.api.resources({
      resource_type: 'image',
      type,
      max_results: 500,
      ...(nextCursor ? { next_cursor: nextCursor } : {}),
    });
    count += result.resources?.length || 0;
    nextCursor = result.next_cursor;
  } while (nextCursor);
  return count;
}

let visibleBefore = 0;
let visibleAfter = 0;
for (const type of ['upload', 'authenticated', 'private']) {
  const before = await countImages(type);
  visibleBefore += before;
  let nextCursor;
  do {
    const result = await cloudinary.api.delete_all_resources({
      resource_type: 'image',
      type,
      invalidate: true,
      ...(nextCursor ? { next_cursor: nextCursor } : {}),
    });
    nextCursor = result.next_cursor;
  } while (nextCursor);
  visibleAfter += await countImages(type);
}

if (visibleAfter > 0) {
  console.error(`Cloudinary reset incomplete: ${visibleAfter} of ${visibleBefore} visible image assets remain.`);
  process.exit(2);
}

console.log(`Cloudinary image reset complete. ${visibleBefore} visible image assets removed; 0 remain. CDN caches were invalidated.`);
