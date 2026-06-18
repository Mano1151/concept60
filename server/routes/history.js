import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { getFirestore } from '../firebaseAdmin.js';
import { admin } from '../firebaseAdmin.js';

const router = Router();

// FIX M-10: Explicitly project only the fields the client needs.
// Prevents accidental exposure of future internal/admin fields.
const formatDoc = (doc) => {
  const d = doc.data();
  return {
    id: doc.id,
    concept:          d.concept          ?? null,
    category:         d.category         ?? null,
    oneLiner:         d.oneLiner         ?? null,
    scenario:         d.scenario         ?? null,
    exampleScenarios: d.exampleScenarios ?? [],
    keywords:         d.keywords         ?? [],
    searchedAt:       d.searchedAt       ?? null,
  };
};

// FIX TC-099: Limit history to 100 most-recent entries to prevent DoS on large history.
const HISTORY_LIMIT = 100;

router.get('/', requireAuth, async (req, res) => {
  try {
    const db = getFirestore();
    const snapshot = await db
      .collection('users')
      .doc(req.user.uid)
      .collection('searchHistory')
      .orderBy('searchedAt', 'desc')
      .limit(HISTORY_LIMIT)
      .get();

    const items = snapshot.docs.map(formatDoc);
    return res.status(200).json(items);
  } catch (error) {
    console.error('[history] fetch error:', error.message);
    return res.status(500).json({ message: 'Unable to load saved history.' });
  }
});

router.delete('/:entryId', requireAuth, async (req, res) => {
  try {
    const { entryId } = req.params;
    if (!entryId || typeof entryId !== 'string' || !entryId.trim() || !/^[a-zA-Z0-9_-]+$/.test(entryId)) {
      return res.status(400).json({ message: 'Invalid entry id.' });
    }

    const db = getFirestore();
    const userHistoryRef = db
      .collection('users')
      .doc(req.user.uid)
      .collection('searchHistory');

    const entryRef = userHistoryRef.doc(entryId);
    const entrySnapshot = await entryRef.get();

    if (!entrySnapshot.exists) {
      return res.status(404).json({ message: 'History entry not found.' });
    }

    await entryRef.delete();
    return res.status(200).json({ message: 'Entry deleted.' });
  } catch (error) {
    console.error('[history] delete error:', error.message);
    return res.status(500).json({ message: 'Unable to delete history entry.' });
  }
});

export default router;
