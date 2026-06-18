import admin from 'firebase-admin';

// dotenv.config() is called only once, at the entry point (index.js) — FIX L-09

const {
  FIREBASE_PROJECT_ID,
  FIREBASE_CLIENT_EMAIL,
  FIREBASE_PRIVATE_KEY,
} = process.env;

// ─── Private key normalization ────────────────────────────────────────────────
// Render (and many CI systems) can store env vars in different formats:
//   • Literal backslash-n  → "-----BEGIN...\n-----END..."  (needs replace)
//   • Actual newlines      → already valid PEM
//   • Quoted string        → "\"-----BEGIN...\""  (needs unquoting)
function normalizePrivateKey(raw) {
  if (!raw) return undefined;
  // 1. Strip surrounding quotes if present
  let key = raw.trim().replace(/^["']|["']$/g, '');
  // 2. If it still has literal \n sequences, replace them with real newlines
  if (!key.includes('\n')) {
    key = key.replace(/\\n/g, '\n');
  }
  return key;
}

const firebasePrivateKey = normalizePrivateKey(FIREBASE_PRIVATE_KEY);

const firebaseCredentials = {
  projectId:   FIREBASE_PROJECT_ID,
  clientEmail: FIREBASE_CLIENT_EMAIL,
  privateKey:  firebasePrivateKey,
};

let _initError = null;

export function getFirebaseApp() {
  if (!admin.apps.length) {
    if (!firebaseCredentials.projectId || !firebaseCredentials.clientEmail || !firebaseCredentials.privateKey) {
      const msg = 'Missing Firebase Admin SDK environment variables. Check FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY on Render.';
      _initError = new Error(msg);
      console.error('[Firebase] Init error:', msg);
      throw _initError;
    }
    // Sanity-check private key format to catch normalization issues early
    if (!firebaseCredentials.privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
      const msg = 'FIREBASE_PRIVATE_KEY does not appear to be a valid PEM private key. It may be missing newlines — set it on Render as a single line with literal \\n characters.';
      _initError = new Error(msg);
      console.error('[Firebase] Init error:', msg);
      throw _initError;
    }
    try {
      admin.initializeApp({
        credential: admin.credential.cert(firebaseCredentials),
      });
      console.log('[Firebase] Admin SDK initialized successfully for project:', firebaseCredentials.projectId);
    } catch (err) {
      _initError = err;
      console.error('[Firebase] initializeApp failed:', err.message);
      throw err;
    }
  }
  return admin.app();
}

export function getInitError() {
  return _initError;
}

export function getFirestore() {
  getFirebaseApp();
  return admin.firestore();
}

export async function verifyIdToken(idToken, checkRevoked = false) {
  getFirebaseApp();
  return admin.auth().verifyIdToken(idToken, checkRevoked);
}

export { admin };

