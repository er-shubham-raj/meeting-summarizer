import { Router, Request, Response } from 'express';
import { env } from '../config/env.js';
import OpenAI from 'openai';

const router = Router();

/**
 * GET /api/health
 * Health check endpoint
 */
router.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    env: env.NODE_ENV,
    mockAi: env.MOCK_AI,
    hasApiKey: !(!env.OPENAI_API_KEY || env.OPENAI_API_KEY.trim() === '' || env.OPENAI_API_KEY === 'your_openai_api_key_here'),
    uptime: process.uptime(),
  });
});

/**
 * GET /api/health/openai-test
 * Diagnostic endpoint to test OpenAI connection & API key validity
 */
router.get('/openai-test', async (_req: Request, res: Response) => {
  const apiKey = env.OPENAI_API_KEY?.trim() || '';
  const hasKey = apiKey.length > 0 && apiKey !== 'your_openai_api_key_here';

  if (!hasKey && !env.MOCK_AI) {
    res.status(400).json({
      success: false,
      message: 'OPENAI_API_KEY is missing or unconfigured in .env file.',
      hasApiKey: false,
    });
    return;
  }

  try {
    const openai = new OpenAI({ apiKey: apiKey || 'mock-key', timeout: 15000 });
    const startTime = Date.now();
    const modelsResponse = await openai.models.list();
    const durationMs = Date.now() - startTime;

    res.status(200).json({
      success: true,
      message: `OpenAI API connection verified successfully in ${durationMs}ms`,
      durationMs,
      modelsCount: modelsResponse.data.length,
      hasWhisperModel: modelsResponse.data.some((m) => m.id === 'whisper-1'),
      hasGpt4oMiniModel: modelsResponse.data.some((m) => m.id === 'gpt-4o-mini'),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: `OpenAI API diagnostic test failed: ${error?.message || 'Connection error'}`,
      errorName: error?.name,
      errorStatus: error?.status || error?.statusCode,
      errorCode: error?.code,
      errorType: error?.type,
      errorCause: error?.cause ? String(error.cause) : undefined,
    });
  }
});

export default router;
