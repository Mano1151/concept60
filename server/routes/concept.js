import { Router } from 'express';
import { admin } from '../firebaseAdmin.js';
import { getFirestore } from '../firebaseAdmin.js';
import { requireAuth, perUserRateLimit } from '../middleware/authMiddleware.js';
import { generateConceptResponse } from '../services/claudeService.js';

const router = Router();

// ─── Allowed difficulty levels ─────────────────────────────────────────────────
const ALLOWED_DIFFICULTIES = new Set(['easy', 'medium', 'hard']);

// ─── Allowed categories — retained for optional categorization ─────────────────
const ALLOWED_CATEGORIES = new Set([
  'math', 'mathematics', 'science', 'technology', 'history',
  'language', 'languages', 'business', 'art', 'arts & culture',
  'arts and culture', 'health', 'health & wellness', 'health and wellness',
  'general', 'other', 'dsa', 'algorithms', 'data structures',
  'sorting', 'searching', 'graphs', 'trees', 'arrays',
]);

const validatePayload = ({ concept, category, difficulty }) => {
  if (!concept || typeof concept !== 'string') {
    return 'The concept field is required and must be a string.';
  }
  if (!category || typeof category !== 'string') {
    return 'The category field is required and must be a string.';
  }
  if (concept.trim().length < 2 || concept.trim().length > 120) {
    return 'Concept length must be between 2 and 120 characters.';
  }
  if (category.trim().length < 2 || category.trim().length > 60) {
    return 'Category length must be between 2 and 60 characters.';
  }
  if (!ALLOWED_CATEGORIES.has(category.trim().toLowerCase())) {
    return 'Invalid category value.';
  }
  if (difficulty && !ALLOWED_DIFFICULTIES.has(difficulty.trim().toLowerCase())) {
    return 'Difficulty must be one of: easy, medium, hard.';
  }
  return null;
};

const normalizeArrayField = (field) => {
  if (!Array.isArray(field)) return [];
  return field
    .filter((item) => typeof item === 'string' && item.trim().length > 2)
    .map((item) => item.trim());
};

const normalizeKeywordsField = (field) => {
  if (!Array.isArray(field)) return [];
  return field
    .map((item) => {
      if (item && typeof item === 'object') {
        const term       = String(item.term || item.word || item.keyword || '').trim();
        const definition = String(item.definition || item.desc || '').trim();
        return term ? { term, definition } : null;
      }
      if (typeof item === 'string' && item.trim().length > 2) {
        return { term: item.trim(), definition: '' };
      }
      return null;
    })
    .filter(Boolean);
};

const getSavedFallback = async (userId, concept, category) => {
  if (!userId) return null;
  const db = getFirestore();
  const snapshot = await db
    .collection('users').doc(userId).collection('searchHistory')
    .where('concept', '==', concept)
    .where('category', '==', category)
    .orderBy('searchedAt', 'desc')
    .limit(1).get();

  if (snapshot.empty) return null;
  const data = snapshot.docs[0].data();
  return {
    oneLiner: data.oneLiner,
    scenario: data.scenario,
    exampleScenarios: data.exampleScenarios,
    keywords: data.keywords,
  };
};

const saveSearchHistory = async (userId, payload) => {
  const db = getFirestore();
  const normalized = {
    concept:          payload.concept,
    category:         payload.category,
    difficulty:       payload.difficulty,
    oneLiner:         payload.oneLiner,
    scenario:         payload.scenario,
    exampleScenarios: Array.isArray(payload.exampleScenarios) ? payload.exampleScenarios : [],
    keywords:         Array.isArray(payload.keywords) ? payload.keywords : [],
    ragMeta:          payload.ragMeta || null,
    searchedAt:       admin.firestore.FieldValue.serverTimestamp(),
  };
  await db.collection('users').doc(userId).collection('searchHistory').add(normalized);
};

// ─── POST /api/concept ─────────────────────────────────────────────────────────
router.post('/', requireAuth, perUserRateLimit(10), async (req, res) => {
  const validationError = validatePayload(req.body);
  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  const concept    = req.body.concept.trim();
  const category   = req.body.category.trim();
  const difficulty = (req.body.difficulty || 'medium').trim().toLowerCase();

  try {
    const result = await generateConceptResponse(concept, difficulty);

    // ── STRICT RAG: if not found in knowledge base, return 404 ───────────────
    if (result.notFound) {
      return res.status(404).json({
        found:   false,
        message: `"${concept}" was not found in the knowledge base. Ask your admin to upload a relevant study material.`,
        concept,
        difficulty,
      });
    }

    const isValidField = (f) =>
      typeof f === 'string' && f.trim().length > 5 && !/(^|\s)(oops|sorry|error)(\s|$)/i.test(f);

    const tryParse = (text) => {
      if (typeof text !== 'string') return null;
      const cleaned = text.replace(/```json|```/g, '').trim();
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return null;
      try { return JSON.parse(jsonMatch[0]); } catch { return null; }
    };

    let parsed = tryParse(result.rawText);

    if (!parsed || !isValidField(parsed.oneLiner) || !isValidField(parsed.scenario)) {
      // One retry
      try {
        const retry = await generateConceptResponse(concept, difficulty);
        if (!retry.notFound) {
          const retryParsed = tryParse(retry.rawText);
          if (retryParsed && isValidField(retryParsed.oneLiner)) {
            parsed = retryParsed;
          }
        }
      } catch {}
    }

    if (!parsed || !isValidField(parsed.oneLiner)) {
      const fallback = await getSavedFallback(req.user.uid, concept, category);
      if (!fallback) throw new Error('Unable to generate a valid concept explanation at this time.');
      parsed = fallback;
    }

    const { oneLiner, scenario, exampleScenarios, keywords } = parsed;
    if (![oneLiner, scenario].every((f) => typeof f === 'string' && f.trim())) {
      throw new Error('Unable to generate a valid concept explanation at this time.');
    }

    const responsePayload = {
      concept,
      category,
      difficulty,
      oneLiner:         oneLiner.trim(),
      scenario:         scenario.trim(),
      exampleScenarios: normalizeArrayField(exampleScenarios),
      keywords:         normalizeKeywordsField(keywords),
      ragMeta:          result.ragMeta || null,
    };

    await saveSearchHistory(req.user.uid, responsePayload);
    return res.status(200).json(responsePayload);

  } catch (error) {
    console.error('[concept] generation error:', error.message);
    if (error.message?.includes('instruction-like text') || error.message?.includes('disallowed')) {
      return res.status(400).json({ message: 'Input contains disallowed content.' });
    }
    return res.status(500).json({ message: 'Unable to generate concept explanation. Please try again.' });
  }
});

export default router;
