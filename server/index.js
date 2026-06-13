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

//const allowedOrigin = process.env.CLIENT_ORIGIN || process.env.VITE_API_URL || 'http://localhost:5173';
const allowedOrigins = [
  'https://concept60.onrender.com',
  'capacitor://localhost',
  'http://localhost',
  'http://localhost:5173',
];
if (allowedOrigin === '*' || !/^https?:\/\/.+/.test(allowedOrigin)) {
  throw new Error('CLIENT_ORIGIN must be a valid http:// or https:// URL and not a wildcard.');
}
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

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
}));

// Limit request body size to prevent large payload abuse
app.use(express.json({ limit: '10kb' }));

// Basic rate limiting
app.set('trust proxy', 1);
const limiter = rateLimit({ windowMs: 60 * 1000, max: 60, standardHeaders: true, legacyHeaders: false }); // 60 requests / minute per IP
app.use(limiter);

const conceptLimiter = rateLimit({ windowMs: 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false });
const videoLimiter = rateLimit({ windowMs: 60 * 1000, max: 15, standardHeaders: true, legacyHeaders: false });
const qaLimiter = rateLimit({ windowMs: 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false });
const historyLimiter = rateLimit({ windowMs: 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false });
const authLimiter = rateLimit({ windowMs: 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false });

app.get('/', (req, res) => {
  res.json({ status: 'Concept in 60 Seconds API is running.' });
});

app.use('/api/concept', conceptLimiter, conceptRouter);
app.use('/api/video', videoLimiter, videoRouter);
app.use('/api/qa', qaLimiter, qaRouter);
app.use('/api/auth', authLimiter, authRouter);
app.use('/api/history', historyLimiter, historyRouter);

const server = app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use. Stop the existing process or set a different PORT in your .env file.`);
  } else {
    console.error('Server error:', error);
  }
  process.exit(1);
});
