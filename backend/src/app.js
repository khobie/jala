import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import rateLimit from 'express-rate-limit';

import env from './config/env.js';
import routes from './routes/index.js';
import { notFound, errorHandler } from './middleware/error.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: env.clientOrigins, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if (env.nodeEnv !== 'test') app.use(morgan('dev'));

// Serve locally-stored uploads (fallback when Cloudinary isn't configured).
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Basic rate limiting on the API.
app.use(
  '/api',
  rateLimit({ windowMs: 15 * 60 * 1000, max: 1000, standardHeaders: true, legacyHeaders: false })
);

app.use('/api', routes);

app.get('/', (_req, res) =>
  res.json({ name: 'Artisan Koforidua API', docs: '/api/health', version: '1.0.0' })
);

app.use(notFound);
app.use(errorHandler);

export default app;
