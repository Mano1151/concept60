import { Router } from 'express';
import { requireAuth, perUserRateLimit } from '../middleware/authMiddleware.js';
import { generatePdfAnswer } from '../services/claudeService.js';

const router = Router();

// FIX C-02: requireAuth — only authenticated users may submit PDF Q&A requests
// FIX H-06: perUserRateLimit — per-UID quota
router.post('/pdf-question', requireAuth, perUserRateLimit(10), async (req, res) => {
  const { pdfText, question } = req.body;

  if (!pdfText || typeof pdfText !== 'string' || !pdfText.trim()) {
    return res.status(400).json({ message: 'PDF text is required and must be a non-empty string.' });
  }
  if (!question || typeof question !== 'string' || !question.trim()) {
    return res.status(400).json({ message: 'Question is required and must be a non-empty string.' });
  }
  if (question.trim().length > 1000) {
    return res.status(400).json({ message: 'Question length must not exceed 1000 characters.' });
  }
  // FIX M-09: align route limit with actual prompt truncation limit (6000 chars)
  if (pdfText.trim().length > 6000) {
    return res.status(400).json({ message: 'PDF text length must not exceed 6000 characters.' });
  }

  try {
    const answer = await generatePdfAnswer(question, pdfText);
    return res.json({ answer });
  } catch (error) {
    console.error('[qa] PDF question error:', error.message);
    // FIX H-01: generic error message
    if (error.message?.includes('instruction-like text') || error.message?.includes('disallowed')) {
      return res.status(400).json({ message: 'Input contains disallowed content.' });
    }
    return res.status(500).json({ message: 'Unable to answer the PDF question. Please try again.' });
  }
});

export default router;
