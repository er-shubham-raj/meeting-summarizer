import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import healthRoutes from './routes/healthRoutes.js';
import meetingRoutes from './routes/meetingRoutes.js';
import { generalLimiter } from './middleware/rateLimitMiddleware.js';
import { errorHandler } from './middleware/errorMiddleware.js';
import { env } from './config/env.js';

const app = express();

// Security middleware
app.use(helmet());

// Production & Development CORS configuration
const allowedOrigins =
  env.NODE_ENV === 'production'
    ? [env.CLIENT_URL]
    : [env.CLIENT_URL, 'http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// General Rate Limiter (Allows 1200 req / 15 min for status polling)
app.use(generalLimiter);

// API Routes
app.use('/api/health', healthRoutes);
app.use('/api/meetings', meetingRoutes);

// 404 Handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found.',
  });
});

// Centralized Error Handler
app.use(errorHandler);

export default app;
