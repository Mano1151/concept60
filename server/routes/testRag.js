/**
 * testRag.js — DEV-ONLY test route for RAG pipeline verification.
 *
 * GET /api/test/rag?concept=BinarySearch
 * No authentication required — remove this file before production deploy.
 */

import { Router } from 'express';
import { retrieveContext, buildRagPrompt } from '../services/ragService.js';
import Groq from 'groq-sdk';

const router = Router();

// Guard: only active in development
router.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ message: 'Not found.' });
  }
  next();
});

// GET /api/test/rag?concept=Binary+Search
router.get('/', async (req, res) => {
  const concept = (req.query.concept || 'Binary Search').trim().slice(0, 120);
  const t0 = Date.now();

  try {
    // Step 1: Retrieve context from Pinecone
    const chunks = await retrieveContext(concept);
    const hasContext = chunks.length > 0;
    const tRetrieve = Date.now() - t0;

    // Step 2: Build the RAG prompt
    const prompt = hasContext
      ? buildRagPrompt(concept, chunks)
      : null;

    if (!prompt) {
      return res.json({
        meta: { concept, promptType: 'No RAG context found', chunksRetrieved: 0, timingMs: { retrieve: tRetrieve } },
        result: null,
        message: 'No relevant DSA chunks found in Pinecone for this concept. Try a DSA topic like "Binary Search".',
      });
    }

    // Step 3: Call Qwen3 via Groq
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const tLLM0 = Date.now();

    const response = await groq.chat.completions.create({
      model:       process.env.QWEN_MODEL || 'qwen/qwen3-32b',
      messages:    [{ role: 'user', content: prompt }],
      temperature: 0.3,
    });

    const tLLM = Date.now() - tLLM0;
    const raw = response?.choices?.[0]?.message?.content || '';
    const clean = raw.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
    const jsonMatch = clean.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

    return res.json({
      meta: {
        concept,
        promptType: 'RAG (grounded in Dsa.pdf)',
        chunksRetrieved: chunks.length,
        promptChars: prompt.length,
        timingMs: { retrieve: tRetrieve, llm: tLLM, total: Date.now() - t0 },
        chunkPreviews: chunks.map(c => c.slice(0, 120) + '...'),
      },
      result: parsed || { raw: clean.slice(0, 500) },
    });

  } catch (error) {
    console.error('[test/rag] error:', error.message);
    return res.status(500).json({ error: error.message, timingMs: Date.now() - t0 });
  }
});

export default router;
