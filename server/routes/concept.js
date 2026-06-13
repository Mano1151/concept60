import { Router } from 'express';
import { admin } from '../firebaseAdmin.js';
import { getFirestore } from '../firebaseAdmin.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { generateConceptResponse } from '../services/claudeService.js';

const router = Router();

const validatePayload = ({ concept, category }) => {
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

  return null;
};

const normalizeArrayField = (field) => {
  if (!Array.isArray(field)) return [];
  return field
    .filter((item) => typeof item === 'string' && item.trim().length > 2)
    .map((item) => item.trim());
};

// Preserves { term, definition } objects returned by the AI,
// and also handles legacy plain-string keyword arrays.
const normalizeKeywordsField = (field) => {
  if (!Array.isArray(field)) return [];
  return field
    .map((item) => {
      if (item && typeof item === 'object') {
        const term = String(item.term || item.word || item.keyword || '').trim();
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
    .collection('users')
    .doc(userId)
    .collection('searchHistory')
    .where('concept', '==', concept)
    .where('category', '==', category)
    .orderBy('searchedAt', 'desc')
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

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
    concept: payload.concept,
    category: payload.category,
    oneLiner: payload.oneLiner,
    scenario: payload.scenario,
    exampleScenarios: Array.isArray(payload.exampleScenarios) ? payload.exampleScenarios : [],
    keywords: Array.isArray(payload.keywords) ? payload.keywords : [],
    searchedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  await db.collection('users').doc(userId).collection('searchHistory').add(normalized);
};

router.post('/', requireAuth, async (req, res) => {
  console.log('==============================');
  console.log('CONCEPT REQUEST RECEIVED');
  console.log('Origin:', req.headers.origin || 'none');
  console.log('Authorization:', req.headers.authorization ? 'Present' : 'Missing');
  console.log('Body:', req.body);
  console.log('==============================');
  const validationError = validatePayload(req.body);
  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  const concept = req.body.concept.trim();
  const category = req.body.category.trim();

  try {
    let rawText = await generateConceptResponse(concept);
    let parsed = null;

    const isValidField = (f) => typeof f === 'string' && f.trim().length > 5 && !/(^|\s)(oops|sorry|error)(\s|$)/i.test(f);

    const tryParse = (text) => {
      if (typeof text !== 'string') {
        return null;
      }

      const cleaned = text.replace(/```json|```/g, '').trim();
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return null;
      }

      try {
        return JSON.parse(jsonMatch[0]);
      } catch (err) {
        return null;
      }
    };

    parsed = tryParse(rawText);

    if (!parsed || !isValidField(parsed.oneLiner) || !isValidField(parsed.scenario)) {
      console.warn('LLM returned invalid or placeholder content. Retrying once without exposing raw response.');
      try {
        const retryText = await generateConceptResponse(concept);
        const retryParsed = tryParse(retryText);
        if (retryParsed && isValidField(retryParsed.oneLiner) && isValidField(retryParsed.scenario)) {
          parsed = retryParsed;
        } else {
          console.warn('Retry did not produce valid content. Attempting saved response fallback.');
          parsed = await getSavedFallback(req.user?.uid, concept, category);
          if (!parsed) {
            throw new Error('Unable to generate a valid concept explanation at this time.');
          }
        }
      } catch (retryErr) {
        console.warn('Retry failed, attempting saved response fallback.');
        parsed = await getSavedFallback(req.user?.uid, concept, category);
        if (!parsed) {
          throw new Error('Unable to generate a valid concept explanation at this time.');
        }
      }
    }

    const { oneLiner, scenario, exampleScenarios, keywords } = parsed || {};
    if (![oneLiner, scenario].every((field) => typeof field === 'string' && field.trim())) {
      throw new Error('Claude returned incomplete explanation data.');
    }

    const responsePayload = {
      concept,
      category,
      oneLiner: oneLiner.trim(),
      scenario: scenario.trim(),
      exampleScenarios: normalizeArrayField(exampleScenarios),
      keywords: normalizeKeywordsField(keywords),
    };

    if (req.user?.uid) {
      await saveSearchHistory(req.user.uid, responsePayload);
    }

    return res.status(200).json(responsePayload);
  } catch (error) {
    console.error(error);
    if (error.message?.includes('disallowed instruction-like text')) {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: error.message || 'Unable to generate concept explanation.' });
  }
});

export default router;
