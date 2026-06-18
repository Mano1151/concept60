import admin from 'firebase-admin';

// dotenv.config() is called only once, at the entry point (index.js) — FIX L-09

const {
  FIREBASE_PROJECT_ID,
  FIREBASE_CLIENT_EMAIL,
  FIREBASE_PRIVATE_KEY,
} = process.env;

// Normalize private key: convert escaped "\n" sequences into real newlines.
const firebasePrivateKey = FIREBASE_PRIVATE_KEY
  ? FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
  : undefined;

const firebaseCredentials = {
  projectId:   FIREBASE_PROJECT_ID,
  clientEmail: FIREBASE_CLIENT_EMAIL,
  privateKey:  firebasePrivateKey,
};

export function getFirebaseApp() {
  if (!admin.apps.length) {
    if (!firebaseCredentials.projectId || !firebaseCredentials.clientEmail || !firebaseCredentials.privateKey) {
      throw new Error('Missing Firebase Admin SDK environment variables.');
    }
    // Sanity-check private key format to catch normalization issues early
    if (!firebaseCredentials.privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
      throw new Error('FIREBASE_PRIVATE_KEY does not appear to be a valid PEM private key.');
    }
    admin.initializeApp({
      credential: admin.credential.cert(firebaseCredentials),
    });
  }
  return admin.app();
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
