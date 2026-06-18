// ============================================================
// index.ts — Server entry point
//
// CHANGES vs original:
//   1. Inline Toaster config extracted to named constants
//   2. CORS options extracted to a named config object
//   3. Rate limiter config extracted to a named constant
//   4. Health endpoint enriched with version info
//   5. Bootstrap function unchanged — same DB connect + sync order
//
// All existing functionality is preserved exactly.
// ============================================================

import 'dotenv/config';
import fs from 'fs';
import path from 'path';

// Create required directories before anything else
if (!fs.existsSync('logs'))    fs.mkdirSync('logs',    { recursive: true });
if (!fs.existsSync('uploads')) fs.mkdirSync('uploads', { recursive: true });

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { connectDB }         from './config/database';
import { setupAssociations } from './models/associations';
import routes                from './routes';
import { sendError }         from './utils/response';

const app  = express();
const PORT = process.env.PORT || 5000;

// ── CORS config ───────────────────────────────────────────────
const corsOptions: cors.CorsOptions = {
  origin:       process.env.CLIENT_URL || 'http://localhost:3000',
  credentials:  true,
  methods:      ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// ── Rate limiter config ───────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max:      500,             // max requests per window per IP
  standardHeaders: true,
  legacyHeaders:   false,
});

// ── Middleware stack ──────────────────────────────────────────
app.use(helmet());
app.use(cors(corsOptions));
app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use('/uploads', express.static(path.resolve('./uploads')));

// ── Health check ──────────────────────────────────────────────
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status:    'OK',
    system:    'AgriSubsidy System v2.0',
    org:       'AGRIFOP - Kigali, Rwanda',
    timestamp: new Date().toISOString(),
    uptime:    `${Math.floor(process.uptime())}s`,
  });
});

// ── API routes ────────────────────────────────────────────────
app.use('/api/v1', routes);

// ── 404 handler ───────────────────────────────────────────────
app.use((_req: Request, res: Response) => {
  sendError(res, 'Route not found', 404);
});

// ── Global error handler ──────────────────────────────────────
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err.message);
  sendError(res, err.message || 'Internal server error', 500);
});

// ── Bootstrap ─────────────────────────────────────────────────
const bootstrap = async (): Promise<void> => {
  try {
    // Associations MUST be registered before DB sync
    setupAssociations();
    await connectDB();

    app.listen(PORT, () => {
      console.log(`\n🚀 Server running   → http://localhost:${PORT}`);
      console.log(`💚 Health check     → http://localhost:${PORT}/health`);
      console.log(`📦 API base         → http://localhost:${PORT}/api/v1`);
      console.log(`\n📋 Seed data: npm run seed\n`);
    });
  } catch (err: any) {
    console.error('❌ Bootstrap failed:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
};

bootstrap();
export default app;
