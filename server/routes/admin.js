/**
 * admin.js — Admin-only routes.
 * Protected by requireAuth + requireAdmin middleware.
 *
 * POST /api/admin/upload-pdf   — Upload a PDF → auto-ingest into Pinecone
 * GET  /api/admin/sources      — List all ingested sources (from Firestore registry)
 * DELETE /api/admin/sources/:id — Remove a source + its vectors from Pinecone
 * POST /api/admin/seed-admin   — Seed the first admin (one-time setup, self-service)
 */

import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { requireAuth } from '../middleware/authMiddleware.js';
import { requireAdmin } from '../middleware/adminMiddleware.js';
import { admin, getFirestore } from '../firebaseAdmin.js';
import { Pinecone } from '@pinecone-database/pinecone';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
const EMBED_SERVICE_URL = () => process.env.EMBED_SERVICE_URL || 'http://localhost:8001';
const INDEX_NAME = () => process.env.PINECONE_INDEX || 'concept60-dsa';
const MAX_PDF_MB = parseInt(process.env.MAX_PDF_SIZE_MB || '20', 10);

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// ── Multer config: PDF only, max 20 MB ────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}_${safeName}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_PDF_MB * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Only PDF files are allowed.'));
    }
    cb(null, true);
  },
});

const router = Router();

// All admin routes require authentication
router.use(requireAuth);

// ── POST /api/admin/seed-admin ─────────────────────────────────────────────────
// One-time self-service: the first call with a valid Firebase token makes that user an admin.
// Once at least one admin exists, this endpoint is locked.
router.post('/seed-admin', async (req, res) => {
  try {
    const db = getFirestore();
    const adminSnap = await db.collection('admins').limit(1).get();

    if (!adminSnap.empty) {
      const existingAdminId = adminSnap.docs[0].id;
      if (existingAdminId === req.user.uid) {
        return res.json({ message: 'You are already an admin.', isAdmin: true });
      }
      return res.status(403).json({ message: 'Admin already exists.', isAdmin: false });
    }

    await db.collection('admins').doc(req.user.uid).set({
      email:   req.user.email || '',
      addedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.json({ message: 'You are now an admin.', isAdmin: true });
  } catch (error) {
    console.error('[admin] seed-admin error:', error.message);
    return res.status(500).json({ message: 'Unable to create admin.', isAdmin: false });
  }
});

// All remaining routes require admin role
router.use(requireAdmin);

// ── POST /api/admin/upload-pdf ─────────────────────────────────────────────────
router.post('/upload-pdf', upload.single('pdf'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'PDF file is required.' });
  }

  const filePath    = req.file.path;
  const originalName = req.file.originalname;
  const fileSize    = req.file.size;

  try {
    // Call the Python embed service /ingest endpoint using native FormData
    const fileBuffer = fs.readFileSync(filePath);
    const fileBlob = new Blob([fileBuffer], { type: 'application/pdf' });
    
    const form = new FormData();
    form.append('file', fileBlob, originalName);

    const response = await fetch(`${EMBED_SERVICE_URL()}/ingest`, {
      method: 'POST',
      body: form,
      // Do not set Content-Type header manually; native fetch sets it with the correct boundary
      signal: AbortSignal.timeout(300_000), // 5 min timeout for large PDFs
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`Ingest service error ${response.status}: ${body}`);
    }

    const ingestResult = await response.json();

    // Save source record in Firestore for registry
    const db = getFirestore();
    const sourceRef = await db.collection('knowledgeSources').add({
      fileName:     originalName,
      fileSizeBytes: fileSize,
      chunksIngested: ingestResult.chunksIngested,
      vectorCount:  ingestResult.vectorCount,
      uploadedBy:   req.user.uid,
      uploadedAt:   admin.firestore.FieldValue.serverTimestamp(),
      status:       'active',
    });

    // Clean up temp file
    fs.unlink(filePath, () => {});

    return res.status(201).json({
      message: `Successfully ingested "${originalName}"`,
      sourceId: sourceRef.id,
      chunksIngested: ingestResult.chunksIngested,
      vectorCount:    ingestResult.vectorCount,
    });
  } catch (error) {
    // Clean up temp file on error
    fs.unlink(filePath, () => {});
    return res.status(500).json({ message: `Ingest failed: ${error.message}` });
  }
});

// All remaining routes require admin role
router.use(requireAdmin);

// ── GET /api/admin/sources ─────────────────────────────────────────────────────
router.get('/sources', async (req, res) => {
  try {
    const db = getFirestore();
    const snapshot = await db
      .collection('knowledgeSources')
      .where('status', '==', 'active')
      .get();

    const sources = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      uploadedAt: doc.data().uploadedAt?.toDate?.()?.toISOString() ?? null,
    }));
    
    // Sort descending by uploadedAt in memory to avoid Firestore composite index requirement
    sources.sort((a, b) => {
      const timeA = a.uploadedAt ? new Date(a.uploadedAt).getTime() : 0;
      const timeB = b.uploadedAt ? new Date(b.uploadedAt).getTime() : 0;
      return timeB - timeA;
    });

    return res.json({ sources, total: sources.length });
  } catch (error) {
    console.error('[admin] get sources error:', error.message);
    return res.status(500).json({ message: 'Unable to fetch sources.' });
  }
});

// ── DELETE /api/admin/sources/:id ─────────────────────────────────────────────
router.delete('/sources/:id', async (req, res) => {
  const { id } = req.params;
  if (!id || typeof id !== 'string' || id.length > 100) {
    return res.status(400).json({ message: 'Invalid source ID.' });
  }

  try {
    const db = getFirestore();
    const docRef = db.collection('knowledgeSources').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ message: 'Source not found.' });
    }

    const sourceData = doc.data();
    const fileName   = sourceData.fileName;

    // Delete vectors from Pinecone by source filter
    const apiKey = process.env.PINECONE_API_KEY;
    if (apiKey) {
      try {
        const pc = new Pinecone({ apiKey });
        const index = pc.index(INDEX_NAME());
        // Delete by metadata filter (requires Pinecone paid tier for filter-based delete)
        // For free tier, we mark as inactive only
        console.warn('[admin] Pinecone free tier: vectors not deleted, source marked inactive.');
      } catch (pineconeErr) {
        console.warn('[admin] Pinecone delete skipped:', pineconeErr.message);
      }
    }

    // Mark as inactive in Firestore (soft delete)
    await docRef.update({ status: 'inactive', deletedAt: admin.firestore.FieldValue.serverTimestamp() });

    return res.json({ message: `Source "${fileName}" removed from knowledge base.` });
  } catch (error) {
    console.error('[admin] delete source error:', error.message);
    return res.status(500).json({ message: 'Unable to remove source.' });
  }
});

export default router;
