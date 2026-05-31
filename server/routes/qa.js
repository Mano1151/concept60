import { Router } from 'express';
import { generatePdfAnswer } from '../services/claudeService.js';

const router = Router();

router.post('/pdf-question', async (req, res) => {
  const { pdfText, question } = req.body;

  if (!pdfText || !question) {
    return res.status(400).json({ message: 'PDF text and question are required.' });
  }

  try {
    const answer = await generatePdfAnswer(question, pdfText);
    return res.json({ answer });
  } catch (error) {
    console.error('PDF QA error:', error);
    return res.status(500).json({ message: 'Unable to answer the PDF question. Please try again.' });
  }
});

export default router;
