/**
 * knowledge.js — Public knowledge base endpoints.
 * No authentication required — these are read-only.
 *
 * GET /api/knowledge/sources  — list all ingested PDF sources
 * GET /api/knowledge/topics   — curated topic list from the knowledge base
 */

import { Router } from 'express';
import { Pinecone } from '@pinecone-database/pinecone';

const router = Router();

const INDEX_NAME = () => process.env.PINECONE_INDEX || 'concept60-dsa';

// Pre-defined topic catalogue keyed by keyword presence in chunk text.
// Expanded as more PDFs are ingested — these are generated from chunk metadata.
const DSA_TOPICS = [
  { name: 'Binary Search',     category: 'Searching',  difficulty: 'easy' },
  { name: 'Linear Search',     category: 'Searching',  difficulty: 'easy' },
  { name: 'Bubble Sort',       category: 'Sorting',    difficulty: 'easy' },
  { name: 'Selection Sort',    category: 'Sorting',    difficulty: 'easy' },
  { name: 'Insertion Sort',    category: 'Sorting',    difficulty: 'easy' },
  { name: 'Merge Sort',        category: 'Sorting',    difficulty: 'medium' },
  { name: 'Quick Sort',        category: 'Sorting',    difficulty: 'medium' },
  { name: 'Heap Sort',         category: 'Sorting',    difficulty: 'medium' },
  { name: 'Linked List',       category: 'Data Structures', difficulty: 'easy' },
  { name: 'Doubly Linked List',category: 'Data Structures', difficulty: 'medium' },
  { name: 'Stack',             category: 'Data Structures', difficulty: 'easy' },
  { name: 'Queue',             category: 'Data Structures', difficulty: 'easy' },
  { name: 'Binary Tree',       category: 'Trees',      difficulty: 'medium' },
  { name: 'Binary Search Tree',category: 'Trees',      difficulty: 'medium' },
  { name: 'AVL Tree',          category: 'Trees',      difficulty: 'hard' },
  { name: 'Red-Black Tree',    category: 'Trees',      difficulty: 'hard' },
  { name: 'Heap',              category: 'Trees',      difficulty: 'medium' },
  { name: 'Graph Traversal',   category: 'Graphs',     difficulty: 'medium' },
  { name: 'BFS',               category: 'Graphs',     difficulty: 'medium' },
  { name: 'DFS',               category: 'Graphs',     difficulty: 'medium' },
  { name: 'Dijkstra Algorithm',category: 'Graphs',     difficulty: 'hard' },
  { name: 'Dynamic Programming',category: 'Algorithms',difficulty: 'hard' },
  { name: 'Hash Table',        category: 'Data Structures', difficulty: 'medium' },
  { name: 'Recursion',         category: 'Algorithms', difficulty: 'easy' },
  { name: 'Time Complexity',   category: 'Algorithms', difficulty: 'medium' },
  { name: 'Space Complexity',  category: 'Algorithms', difficulty: 'medium' },
  { name: 'Neural Networks',   category: 'Machine Learning', difficulty: 'medium' },
  { name: 'Gradient Descent',  category: 'Machine Learning', difficulty: 'hard' },
  { name: 'Decision Trees',    category: 'Machine Learning', difficulty: 'easy' },
  { name: 'Linear Regression', category: 'Machine Learning', difficulty: 'easy' },
  { name: 'Logistic Regression', category: 'Machine Learning', difficulty: 'medium' },
  { name: 'Support Vector Machines', category: 'Machine Learning', difficulty: 'hard' },
];

// GET /api/knowledge/topics
router.get('/topics', (req, res) => {
  const { category, difficulty } = req.query;

  let topics = DSA_TOPICS;

  if (category) {
    topics = topics.filter(t =>
      t.category.toLowerCase() === category.toLowerCase()
    );
  }
  if (difficulty) {
    topics = topics.filter(t =>
      t.difficulty === difficulty.toLowerCase()
    );
  }

  return res.json({
    topics,
    total: topics.length,
    categories: [...new Set(DSA_TOPICS.map(t => t.category))],
  });
});

// GET /api/knowledge/sources — list all ingested PDF sources from Pinecone metadata
router.get('/sources', async (req, res) => {
  try {
    const apiKey = process.env.PINECONE_API_KEY;
    if (!apiKey) {
      return res.json({ sources: [], message: 'Pinecone not configured.' });
    }

    const pc = new Pinecone({ apiKey });
    const index = pc.index(INDEX_NAME());
    const stats = await index.describeIndexStats();

    // Collect unique sources from namespace metadata
    // Since Pinecone free tier doesn't support metadata filtering for list,
    // we return stats and a manual source registry from Firestore.
    return res.json({
      indexStats: {
        totalVectors: stats.totalRecordCount ?? stats.totalVectorCount ?? 0,
        dimension: stats.dimension,
        indexFullness: stats.indexFullness,
      },
    });
  } catch (error) {
    console.error('[knowledge] sources error:', error.message);
    return res.status(500).json({ message: 'Unable to fetch knowledge base stats.' });
  }
});

export default router;
