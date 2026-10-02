const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const admin = require('firebase-admin');
const crypto = require('node:crypto');
const { v2: cloudinary } = require('cloudinary');

admin.initializeApp();
const db = admin.firestore();
const CLOUDINARY_CLOUD_NAME = defineSecret('CLOUDINARY_CLOUD_NAME');
const CLOUDINARY_API_KEY = defineSecret('CLOUDINARY_API_KEY');
const CLOUDINARY_API_SECRET = defineSecret('CLOUDINARY_API_SECRET');
const secrets = [CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET];
const ADMIN_EMAIL = 'jksurampudi5@gmail.com';
const CATEGORIES = new Set(['profile', 'pet', 'missing-report', 'sighting']);

/** Configures the Cloudinary SDK from the deployed Firebase secrets. */
function configureCloudinary() {
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME.value(),
    api_key: CLOUDINARY_API_KEY.value(),
    api_secret: CLOUDINARY_API_SECRET.value(),
    secure: true,
  });
}

/** Returns the callable request's auth context, or throws an unauthenticated HttpsError. */
function requireAuth(request) {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in is required.');
  return request.auth;
}

/** Checks the admin claim or configured administrator email in an auth context. */
function isAdmin(auth) {
  return auth.token.email?.toLowerCase() === ADMIN_EMAIL || auth.token.admin === true;
}

/** Converts a value to an identifier with only letters, digits, underscores, and hyphens, capped at 120 characters. */
function clean(value) {
  return String(value || '').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 120);
}

/** Hashes a Cloudinary public ID into a deterministic Firestore document ID. */
function assetDocId(publicId) {
  return crypto.createHash('sha256').update(publicId).digest('hex');
}

/** Returns the user-scoped media folder for a validated category, defaulting to sightings. */
function folderFor(category, uid) {
  if (category === 'profile') return `findlostpuppy/private/profiles/${uid}`;
  if (category === 'pet') return `findlostpuppy/private/pets/${uid}`;
  if (category === 'missing-report') return `findlostpuppy/public-alerts/missing-reports/${uid}`;
  return `findlostpuppy/public-alerts/sightings/${uid}`;
}

/** Deletes Firestore references in sequential batches of at most 400; rejects if a commit fails. */
async function deleteDocumentsInChunks(refs) {
  for (let index = 0; index < refs.length; index += 400) {
    const batch = db.batch();
    refs.slice(index, index + 400).forEach((ref) => batch.delete(ref));
    await batch.commit();
  }
}

exports.createMediaUploadAuthorization = onCall({ secrets }, async (request) => {
  const auth = requireAuth(request);
  const category = String(request.data?.category || '');
  if (!CATEGORIES.has(category)) throw new HttpsError('invalid-argument', 'Unsupported media category.');
  const referenceId = clean(request.data?.referenceId);
  if (!referenceId) throw new HttpsError('invalid-argument', 'A media reference is required.');
  configureCloudinary();
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = folderFor(category, auth.uid);
  const publicId = `media_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  const deliveryType = 'authenticated';
  const params = { timestamp, folder, public_id: publicId, type: deliveryType };
  return {
    ...params,
    cloudName: CLOUDINARY_CLOUD_NAME.value(),
    apiKey: CLOUDINARY_API_KEY.value(),
    signature: cloudinary.utils.api_sign_request(params, CLOUDINARY_API_SECRET.value()),
    category,
    referenceId,
  };
});

exports.finalizeMediaUpload = onCall({ secrets }, async (request) => {
  const auth = requireAuth(request);
  const { publicId, category, referenceId, deliveryType, bytes, format, previousPublicId } = request.data || {};
  if (!CATEGORIES.has(category) || !publicId || !referenceId) throw new HttpsError('invalid-argument', 'Invalid media result.');
  const expectedFolder = folderFor(category, auth.uid);
  if (!String(publicId).startsWith(`${expectedFolder}/`)) throw new HttpsError('permission-denied', 'Unexpected media path.');
  if (!['jpg', 'jpeg'].includes(String(format).toLowerCase()) || Number(bytes) <= 0 || Number(bytes) > 5 * 1024 * 1024) {
    throw new HttpsError('invalid-argument', 'Uploaded image failed validation.');
  }
  configureCloudinary();
  const expectedType = 'authenticated';
  if (deliveryType !== expectedType) throw new HttpsError('invalid-argument', 'Unexpected media delivery type.');
  let verifiedAsset;
  try {
    verifiedAsset = await cloudinary.api.resource(publicId, { resource_type: 'image', type: expectedType });
  } catch {
    throw new HttpsError('not-found', 'Uploaded image could not be verified.');
  }
  if (
    !['jpg', 'jpeg'].includes(String(verifiedAsset.format).toLowerCase()) ||
    Number(verifiedAsset.bytes) <= 0 ||
    Number(verifiedAsset.bytes) > 5 * 1024 * 1024 ||
    verifiedAsset.resource_type !== 'image'
  ) {
    await cloudinary.uploader.destroy(publicId, { type: expectedType, invalidate: true });
    throw new HttpsError('invalid-argument', 'Uploaded image failed server validation.');
  }
  await db.collection('media_assets').doc(assetDocId(publicId)).set({
    publicId, ownerId: auth.uid, category, referenceId, deliveryType: expectedType,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  if (previousPublicId && previousPublicId !== publicId) {
    const oldRef = db.collection('media_assets').doc(assetDocId(previousPublicId));
    const old = await oldRef.get();
    if (old.exists && (old.data().ownerId === auth.uid || isAdmin(auth))) {
      const result = await cloudinary.uploader.destroy(previousPublicId, { type: old.data().deliveryType || 'upload', invalidate: true });
      if (!['ok', 'not found'].includes(result?.result)) throw new HttpsError('internal', 'Cloud image deletion failed.');
      await oldRef.delete();
    }
  }
  const secureUrl = cloudinary.url(publicId, {
    secure: true,
    type: expectedType,
    sign_url: expectedType === 'authenticated',
    transformation: [{ fetch_format: 'auto', quality: 'auto' }],
  });
  return { secureUrl, publicId };
});

exports.deleteMediaAsset = onCall({ secrets }, async (request) => {
  const auth = requireAuth(request);
  const publicId = String(request.data?.publicId || '');
  if (!publicId) throw new HttpsError('invalid-argument', 'Media identifier is required.');
  const ref = db.collection('media_assets').doc(assetDocId(publicId));
  const asset = await ref.get();
  if (!asset.exists) throw new HttpsError('not-found', 'Media record was not found.');
  const data = asset.data();
  if (data.ownerId !== auth.uid && !isAdmin(auth)) throw new HttpsError('permission-denied', 'You cannot delete this image.');
  configureCloudinary();
  const result = await cloudinary.uploader.destroy(publicId, { type: data.deliveryType || 'upload', invalidate: true });
  if (!['ok', 'not found'].includes(result.result)) throw new HttpsError('internal', 'Cloud image deletion failed.');
  await ref.delete();
  return { deleted: true };
});

exports.deleteMyAccount = onCall({ secrets, timeoutSeconds: 540 }, async (request) => {
  const auth = requireAuth(request);
  if (request.data?.confirmation !== 'DELETE') {
    throw new HttpsError('failed-precondition', 'Account deletion confirmation does not match.');
  }
  configureCloudinary();

  const uidVariants = [auth.uid, `owner-${auth.uid}`];
  const email = String(auth.token.email || '').toLowerCase().trim();
  const refs = new Map();
  /** Collects document references from a query snapshot, deduplicating by document path. */
  const addDocs = (snapshot) => snapshot.docs.forEach((item) => refs.set(item.ref.path, item.ref));

  const mediaSnapshot = await db.collection('media_assets').where('ownerId', '==', auth.uid).get();
  for (const mediaDoc of mediaSnapshot.docs) {
    const media = mediaDoc.data();
    const result = await cloudinary.uploader.destroy(media.publicId, {
      type: media.deliveryType || 'upload',
      invalidate: true,
    });
    if (!['ok', 'not found'].includes(result.result)) {
      throw new HttpsError('internal', 'An account image could not be deleted. Please try again.');
    }
    refs.set(mediaDoc.ref.path, mediaDoc.ref);
  }

  for (const profileId of uidVariants) refs.set(`profiles/${profileId}`, db.doc(`profiles/${profileId}`));
  for (const ownerId of uidVariants) {
    addDocs(await db.collection('pets').where('ownerId', '==', ownerId).get());
    addDocs(await db.collection('missing_reports').where('ownerId', '==', ownerId).get());
  }
  addDocs(await db.collection('sightings').where('reporterUserId', '==', auth.uid).get());
  addDocs(await db.collection('app_suggestions').where('userId', '==', auth.uid).get());

  if (email) {
    addDocs(await db.collection('profiles').where('email', '==', email).get());
    addDocs(await db.collection('sightings').where('reporterEmail', '==', email).get());
  }

  const ownedReportIds = [...refs.values()]
    .filter((ref) => ref.parent.id === 'missing_reports')
    .map((ref) => ref.id);
  for (const reportId of ownedReportIds) {
    addDocs(await db.collection('sightings').where('reportId', '==', reportId).get());
  }

  await deleteDocumentsInChunks([...refs.values()]);
  await admin.auth().deleteUser(auth.uid);
  return { deleted: true };
});

exports.hardResetCloudinary = onCall({ secrets, timeoutSeconds: 540 }, async (request) => {
  const auth = requireAuth(request);
  if (!isAdmin(auth)) throw new HttpsError('permission-denied', 'Administrator access is required.');
  if (request.data?.confirmation !== 'DELETE ALL FINDLOSTPUPPY MEDIA') {
    throw new HttpsError('failed-precondition', 'Hard reset confirmation does not match.');
  }
  configureCloudinary();
  for (const type of ['upload', 'authenticated', 'private']) {
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
  }
  const batchSize = 400;
  while (true) {
    const snap = await db.collection('media_assets').limit(batchSize).get();
    if (snap.empty) break;
    const batch = db.batch();
    snap.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
  }
  return { deleted: true };
});
