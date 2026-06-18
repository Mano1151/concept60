import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import conceptRouter from './routes/concept.js';
import videoRouter from './routes/video.js';
import qaRouter from './routes/qa.js';
import historyRouter from './routes/history.js';
import authRouter from './routes/auth.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// ─── CORS — FIX C-01: Use explicit allowlist, never reflect arbitrary origins ──
const envClientOrigin = process.env.CLIENT_ORIGIN;
let allowedOrigins = [
  'https://concept60.onrender.com',
  'capacitor://localhost',
  'http://localhost',
  'http://localhost:5173',
];
if (envClientOrigin) {
  if (envClientOrigin.trim() === '*') {
    throw new Error('CLIENT_ORIGIN must not be a wildcard.');
  }
  allowedOrigins = envClientOrigin.split(',').map((s) => s.trim()).filter(Boolean);
}

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (server-to-server, Capacitor, curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS policy.'));
  },
  credentials: true,
}));

// ─── Security Headers ──────────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      blockAllMixedContent: [],
      fontSrc: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      imgSrc: ["'self'", 'data:'],
      objectSrc: ["'none'"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'"],
      upgradeInsecureRequests: [],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));

// ─── Body Parser — FIX C-03: Global limit 10kb (overridden per route where needed) ──
app.use(express.json({ limit: '10kb' }));

// ─── Rate Limiting — FIX M-07: No localhost bypass; all IPs treated equally ──
app.set('trust proxy', 1);

const limiter          = rateLimit({ windowMs: 60_000, max: 60,  standardHeaders: true, legacyHeaders: false });
const conceptLimiter   = rateLimit({ windowMs: 60_000, max: 10,  standardHeaders: true, legacyHeaders: false });
const videoLimiter     = rateLimit({ windowMs: 60_000, max: 8,   standardHeaders: true, legacyHeaders: false });
const qaLimiter        = rateLimit({ windowMs: 60_000, max: 10,  standardHeaders: true, legacyHeaders: false });
const historyLimiter   = rateLimit({ windowMs: 60_000, max: 20,  standardHeaders: true, legacyHeaders: false });
const authLimiter      = rateLimit({ windowMs: 60_000, max: 30,  standardHeaders: true, legacyHeaders: false });

app.use(limiter);

// ─── Root status endpoint ──────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ status: 'Concept in 60 Seconds API is running.' });
});

// ─── Test endpoint — FIX M-03: No longer reflects origin header ──────────────
app.get('/api/test', (req, res) => {
  res.json({ success: true });
});

// ─── Routes ───────────────────────────────────────────────────────────────────
// FIX C-03: per-route body limits appropriate to each endpoint's data size
app.use('/api/concept', express.json({ limit: '5kb' }),  conceptLimiter, conceptRouter);
app.use('/api/video',   express.json({ limit: '5kb' }),  videoLimiter,   videoRouter);
app.use('/api/qa',      express.json({ limit: '50kb' }), qaLimiter,      qaRouter);
app.use('/api/auth',    authLimiter,                                      authRouter);
app.use('/api/history', historyLimiter,                                   historyRouter);

const server = app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use.`);
  } else {
    console.error('Server error:', error.message);
  }
  process.exit(1);
});
