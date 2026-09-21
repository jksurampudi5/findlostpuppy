const requiredFirebaseVariables = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
];

const missingVariables = requiredFirebaseVariables.filter((name) => !process.env[name]?.trim());

if (missingVariables.length > 0) {
  console.error(`Missing Firebase build configuration: ${missingVariables.join(', ')}`);
  console.error('Provide these VITE_FIREBASE_* values before building the Android release.');
  process.exit(1);
}