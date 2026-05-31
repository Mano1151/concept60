import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import conceptRouter from './routes/concept.js';
import videoRouter from './routes/video.js';
import qaRouter from './routes/qa.js';
import historyRouter from './routes/history.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

const allowedOrigin = process.env.CLIENT_ORIGIN || process.env.VITE_API_URL || 'http://localhost:5173';
app.use(cors({ origin: allowedOrigin }));

app.use(helmet());

// Limit request body size to prevent large payload abuse
app.use(express.json({ limit: '10kb' }));

// Basic rate limiting
app.set('trust proxy', 1);
const limiter = rateLimit({ windowMs: 60 * 1000, max: 60 }); // 60 requests / minute per IP
app.use(limiter);

app.get('/', (req, res) => {
  res.json({ status: 'Concept in 60 Seconds API is running.' });
});

app.use('/api/concept', conceptRouter);
app.use('/api/video', videoRouter);
app.use('/api/qa', qaRouter);
app.use('/api/history', historyRouter);

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
