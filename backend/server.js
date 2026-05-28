import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDb } from './database.js';
import authRoutes from './routes/auth.js';
import postRoutes from './routes/posts.js';
import commentRoutes from './routes/comments.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// --- CORS: Allow local dev + Vercel production frontend ---
const allowedOrigins = [
  'http://localhost:5180',
  'http://localhost:5173',
  'http://localhost:3000',
];

// Add the production Vercel frontend URL from env if set
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (e.g. Render health checks, curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    return callback(new Error(`CORS policy: Origin ${origin} not allowed`));
  },
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger (dev mode)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });
}

// --- DB Init Middleware for Serverless ---
let dbInitialized = false;
let initPromise = null;

const ensureDbInitialized = async (req, res, next) => {
  try {
    if (!dbInitialized) {
      if (!initPromise) {
        initPromise = initDb().then(() => {
          dbInitialized = true;
        });
      }
      await initPromise;
    }
    next();
  } catch (err) {
    next(err);
  }
};

app.use(ensureDbInitialized);

// --- API Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/posts/:id/comments', commentRoutes);
app.use('/api/comments', commentRoutes);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Serve Static Frontend in Production ---
if (process.env.NODE_ENV === 'production' && !process.env.VERCEL) {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
  // Redirect non-API requests to the React SPA index.html
  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.resolve(__dirname, '../frontend/dist/index.html'));
  });
}

// --- Health Check ---
app.get('/api/health', (_req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// --- Global Error Handler ---
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'An unexpected server error occurred.' });
});

// --- Start Server after DB is ready ---
if (!process.env.VERCEL) {
  initDb().then(() => {
    app.listen(PORT, () => {
      console.log(`\n🚀 Blog API Server running at http://localhost:${PORT}`);
      console.log(`📦 SQLite database initialized.\n`);
    });
  });
} else {
  // In Vercel serverless environment, initiate the database connection
  initDb();
}

export default app;
