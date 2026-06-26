/**
 * adminMiddleware.js — Admin authentication middleware.
 *
 * Admin status is determined by whether the authenticated user's UID
 * exists as a document in the Firestore `admins` collection.
 *
 * To add an admin:
 *   In Firebase Console → Firestore → admins collection → Add document
 *   Document ID = Firebase UID, fields: { email, addedAt }
 *
 * OR via this server's seed endpoint (see admin.js).
 */

import { getFirestore } from '../firebaseAdmin.js';

export async function requireAdmin(req, res, next) {
  // requireAuth must run before this middleware
  if (!req.user?.uid) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  try {
    const db = getFirestore();
    const adminDoc = await db.collection('admins').doc(req.user.uid).get();

    if (!adminDoc.exists) {
      return res.status(403).json({ message: 'Admin access required.' });
    }

    req.isAdmin = true;
    next();
  } catch (error) {
    console.error('[admin] Admin check failed:', error.message);
    return res.status(500).json({ message: 'Unable to verify admin access.' });
  }
}
