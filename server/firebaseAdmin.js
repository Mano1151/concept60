import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

const {
  FIREBASE_PROJECT_ID,
  FIREBASE_CLIENT_EMAIL,
  FIREBASE_PRIVATE_KEY,
} = process.env;

const firebaseCredentials = {
  projectId: FIREBASE_PROJECT_ID,
  clientEmail: FIREBASE_CLIENT_EMAIL,
  privateKey: FIREBASE_PRIVATE_KEY?.includes('-----BEGIN PRIVATE KEY-----')
    ? FIREBASE_PRIVATE_KEY
    : FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

export function getFirebaseApp() {
  if (!admin.apps.length) {
    if (!firebaseCredentials.projectId || !firebaseCredentials.clientEmail || !firebaseCredentials.privateKey) {
      throw new Error('Missing Firebase Admin SDK environment variables.');
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

export async function verifyIdToken(idToken) {
  getFirebaseApp();
  return admin.auth().verifyIdToken(idToken);
}

export { admin };
