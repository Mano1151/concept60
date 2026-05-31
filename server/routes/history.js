import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { getFirestore } from '../firebaseAdmin.js';

const router = Router();

const formatDoc = (doc) => ({ id: doc.id, ...doc.data() });

router.get('/', requireAuth, async (req, res) => {
  try {
    const db = getFirestore();
    const snapshot = await db
      .collection('users')
      .doc(req.user.uid)
      .collection('searchHistory')
      .orderBy('searchedAt', 'desc')
      .get();

    const items = snapshot.docs.map(formatDoc);
    return res.status(200).json(items);
  } catch (error) {
    console.error('Error fetching history:', error);
    return res.status(500).json({ message: 'Unable to load saved history.' });
  }
});

router.delete('/:entryId', requireAuth, async (req, res) => {
  try {
    const { entryId } = req.params;
    const db = getFirestore();
    await db
      .collection('users')
      .doc(req.user.uid)
      .collection('searchHistory')
      .doc(entryId)
      .delete();

    return res.status(200).json({ message: 'Entry deleted.' });
  } catch (error) {
    console.error('Error deleting history entry:', error);
    return res.status(500).json({ message: 'Unable to delete saved history entry.' });
  }
});

export default router;
