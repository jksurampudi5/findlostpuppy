# Firebase setup for FindLostPuppy

Use the Spark plan.

## Collections

- `profiles/{uid}`: one owner profile per Firebase Auth user.
- `pets/{uid}`: one pet per owner, updated in place.
- `missing_reports/{uid}`: one owner safety/report row, updated in place.
- `sightings/{sightingId}`: private sighting records.
- `app_suggestions/{suggestionId}`: user feedback and screenshots for admin review.

This follows SCD Type 1 for owner, pet, and report records: updates overwrite the same document instead of creating duplicates. Deletes are hard deletes.

## Console steps

1. Project overview -> Add app -> Web.
2. App nickname: `FindLostPuppy Web`.
3. Copy the Firebase config values into `.env`.
4. Authentication -> Sign-in method -> Enable `Email/Password`, then enable `Email link`.
5. Authentication -> Settings -> Authorized domains:
   - `localhost`
   - `jksurampudi5.github.io`
    - Add the exact production hostname users visit, preserving protocol and host
       spelling. Do not mix `www` and non-`www` hosts.
6. Authentication -> Settings -> Authorized domains / OAuth redirect setup:
    - Keep `VITE_FIREBASE_AUTH_DOMAIN` set to the Firebase project's auth domain
       (`findlostpuppy.firebaseapp.com` unless the Firebase console shows another
       value).
    - The app must start and return on the same deployed origin, for example
       `https://jksurampudi5.github.io/findlostpuppy/`. A flow started on another
       protocol or hostname can lose redirect state even when the Firebase config
       is correct.
7. Firestore Database -> Create database -> Production mode.
8. Firestore Rules -> paste `firebase.firestore.rules`.
9. Storage -> Get started -> Production mode.
10. Storage Rules -> paste `firebase.storage.rules`.

## Required env values

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=findlostpuppy.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=findlostpuppy
VITE_FIREBASE_STORAGE_BUCKET=findlostpuppy.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```
