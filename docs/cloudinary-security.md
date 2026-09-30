# Cloudinary Privacy and Security Controls

Cloudinary does not apply Firebase/Firestore security rules. FindLostPuppy routes every upload and deletion through an authenticated Cloudflare Worker. All Cloudinary images, including recovery images, use Cloudinary's authenticated delivery type and signed delivery URLs.

## Enforced in application code

- Every secure upload authorization requires a signed-in Firebase user and is signed by the backend.
- Profile, pet, missing-report, and sighting photos use authenticated Cloudinary assets under per-user folders.
- Public images are decoded and re-encoded as JPEG before upload. This removes EXIF/GPS metadata and caps the longest edge at 1600 pixels.
- Accepted source types are JPEG, PNG, and WebP, with a 5 MB client limit.
- Generated public IDs contain no user ID, email, phone number, pet name, location, or report description.
- Assets are restricted to category-specific folders owned by the signed-in user.
- The Worker fetches the resulting Cloudinary resource and checks its authenticated delivery type, JPEG format, owner-scoped public-ID prefix, and 5 MB limit before returning a signed URL.
- API secrets and deletion signatures are never included in the client.
- Delete requests require a public ID under the signed-in user's folder prefix or an administrator claim.
- Replacing a photo deletes and invalidates the prior Cloudinary asset after the new upload succeeds.
- `/account/media-cleanup` removes the signed-in user's Cloudinary images only. The client separately deletes Firestore records and the Firebase Authentication account before clearing local data.
- The admin clean-slate action permanently deletes every image resource in the connected Cloudinary account across `upload`, `authenticated`, and `private` delivery types.

## Required deployment configuration

Set the three encrypted Worker secrets without putting them in a `VITE_` variable or committing them:

```sh
npx wrangler secret put CLOUDINARY_CLOUD_NAME
npx wrangler secret put CLOUDINARY_API_KEY
npx wrangler secret put CLOUDINARY_API_SECRET
```

Keep `VITE_CLOUDINARY_SECURE_FUNCTIONS=true` and set `VITE_MEDIA_WORKER_URL` to the deployed Worker URL. Only run the Admin Portal clean-slate control after Worker deployment succeeds.

Delete or disable every legacy unsigned upload preset in the Cloudinary console. The client no longer contains an unsigned upload path. Re-run `npm run verify:cloudinary-privacy` after changes. Never place the Cloudinary API secret in `.env` variables beginning with `VITE_`.
