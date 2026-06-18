import { Router } from 'express';
import { requireAuth, perUserRateLimit } from '../middleware/authMiddleware.js';
import { generateVideoResponse } from '../services/claudeService.js';

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

// FIX C-02: requireAuth — only authenticated users may consume AI credits
// FIX H-06: perUserRateLimit — per-UID quota
router.post('/', requireAuth, perUserRateLimit(8), async (req, res) => {
  const validationError = validatePayload(req.body);
  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  const concept = req.body.concept.trim();

  try {
    const result = await generateVideoResponse(concept);

    if (result?.type === 'video' && result.videoUrl) {
      return res.status(200).json(result);
    }
    if (result?.type === 'storyboard' && Array.isArray(result.storyboard)) {
      return res.status(200).json(result);
    }
    if (result?.type === 'slideshow' && Array.isArray(result.slides)) {
      return res.status(200).json(result);
    }

    throw new Error('Video generation produced an unexpected result.');
  } catch (error) {
    console.error('[video] generation error:', error.message);
    // FIX H-01: generic error — never propagate internal SDK error messages
    if (error.message?.includes('instruction-like text') || error.message?.includes('disallowed')) {
      return res.status(400).json({ message: 'Input contains disallowed content.' });
    }
    return res.status(500).json({ message: 'Unable to generate video. Please try again.' });
  }
});

export default router;
