import { verifyIdToken } from '../firebaseAdmin.js';

export async function optionalAuth(req, res, next) {
  const authorization = req.headers.authorization || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : null;

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decodedToken = await verifyIdToken(token, true);
    req.user = decodedToken;
    return next();
  } catch (error) {
    req.user = null;
    return next();
  }
}

export async function requireAuth(req, res, next) {
  const authorization = req.headers.authorization || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : null;

  if (!token) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  try {
    const decodedToken = await verifyIdToken(token, true);
    req.user = decodedToken;
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid, revoked, or expired auth token.' });
  }
}

export function requireRole(requiredRole) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    const roles = Array.isArray(req.user.roles)
      ? req.user.roles
      : typeof req.user.role === 'string'
      ? [req.user.role]
      : [];

    if (req.user.admin === true || roles.includes(requiredRole) || req.user[requiredRole] === true) {
      return next();
    }

    return res.status(403).json({ message: 'Forbidden: insufficient privileges.' });
  };
}
