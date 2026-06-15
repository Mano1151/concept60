import { Router } from 'express';
import { optionalAuth } from '../middleware/authMiddleware.js';
import { generatePdfAnswer } from '../services/claudeService.js';

const router = Router();

router.post('/pdf-question', optionalAuth, async (req, res) => {
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

  if (pdfText.trim().length > 30000) {
    return res.status(400).json({ message: 'PDF text length must not exceed 30000 characters.' });
  }

  try {
    const answer = await generatePdfAnswer(question, pdfText);
    return res.json({ answer });
  } catch (error) {
    console.error('PDF QA error:', error);
    if (error.message?.includes('instruction-like text')) {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: 'Unable to answer the PDF question. Please try again.' });
  }
});

export default router;
