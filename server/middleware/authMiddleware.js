import { verifyIdToken } from '../firebaseAdmin.js';

// ─── Optional Auth ─────────────────────────────────────────────────────────────
// FIX TC-021: If a token IS present but fails verification (e.g., revoked),
// return 401 instead of silently degrading to anonymous.
export async function optionalAuth(req, res, next) {
  const authorization = req.headers.authorization || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : null;

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decodedToken = await verifyIdToken(token);
    req.user = decodedToken;
    return next();
  } catch (error) {
    console.error('optionalAuth verification failed:', error);
    // Token was provided but is invalid or revoked — reject with 401.
    return res.status(401).json({ message: 'Invalid, revoked, or expired auth token.' });
  }
}

// ─── Require Auth ──────────────────────────────────────────────────────────────
export async function requireAuth(req, res, next) {
  const authorization = req.headers.authorization || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : null;

  if (!token) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  try {
    const decodedToken = await verifyIdToken(token);
    req.user = decodedToken;
    return next();
  } catch (error) {
    console.error('requireAuth verification failed:', error);
    return res.status(401).json({ message: 'Invalid, revoked, or expired auth token.' });
  }
}

// ─── Require Role — FIX H-04: No dynamic property lookup on JWT payload ───────
// Only checks known, explicitly enumerated claim paths.
export function requireRole(requiredRole) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    // Check admin flag
    if (req.user.admin === true) {
      return next();
    }

    // Check roles array (e.g., custom claim: roles: ['editor'])
    const roles = Array.isArray(req.user.roles) ? req.user.roles : [];
    if (roles.includes(requiredRole)) {
      return next();
    }

    // Check single role string (e.g., custom claim: role: 'editor')
    if (typeof req.user.role === 'string' && req.user.role === requiredRole) {
      return next();
    }

    // NOTE: Dynamic lookup (req.user[requiredRole]) intentionally removed — H-04.
    return res.status(403).json({ message: 'Forbidden: insufficient privileges.' });
  };
}

// ─── Per-User Rate Limiter — FIX H-06 ─────────────────────────────────────────
// Simple in-memory per-UID rate limiter (supplements IP-based limiter).
const userRequestCounts = new Map();

export function perUserRateLimit(maxPerMinute) {
  return (req, res, next) => {
    const uid = req.user?.uid;
    if (!uid) return next(); // Unauthenticated requests already covered by IP limiter

    const now = Date.now();
    const windowMs = 60_000;
    let entry = userRequestCounts.get(uid);

    if (!entry || now > entry.resetAt) {
      entry = { count: 0, resetAt: now + windowMs };
    }

    entry.count += 1;
    userRequestCounts.set(uid, entry);

    if (entry.count > maxPerMinute) {
      return res.status(429).json({ message: 'Account rate limit exceeded. Please slow down.' });
    }

    return next();
  };
}
