import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { admin } from '../firebaseAdmin.js';

const router = Router();

router.post('/logout', requireAuth, async (req, res) => {
  try {
    await admin.auth().revokeRefreshTokens(req.user.uid);
    return res.status(200).json({ message: 'User logout and token revocation initiated.' });
  } catch (error) {
    console.error('Error revoking user tokens:', error);
    return res.status(500).json({ message: 'Unable to revoke authentication tokens.' });
  }
});

export default router;
