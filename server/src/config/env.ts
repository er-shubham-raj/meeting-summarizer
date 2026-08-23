import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load .env files in non-production environments
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: path.resolve(__dirname, '../../.env'), override: true });
  dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
  dotenv.config();
}

const envSchema = z
  .object({
    PORT: z.string().default('5000').transform((val) => parseInt(val, 10)),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    CLIENT_URL: z.string().default('http://localhost:5173'),
    DATABASE_URL: z.string().optional(),
    OPENAI_API_KEY: z.string().optional().default(''),
    GROQ_API_KEY: z.string().optional().default(''),
    MOCK_AI: z
      .string()
      .optional()
      .transform((val) => val === 'true' || val === '1'),
  })
  .superRefine((data, ctx) => {
    // Require DATABASE_URL in production
    if (data.NODE_ENV === 'production' && (!data.DATABASE_URL || data.DATABASE_URL.trim() === '')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'DATABASE_URL environment variable is required in production.',
        path: ['DATABASE_URL'],
      });
    }

    // Require GROQ_API_KEY when MOCK_AI=false
    const isMockMode = data.NODE_ENV === 'production' ? false : (data.MOCK_AI ?? false);
    if (
      !isMockMode &&
      (!data.GROQ_API_KEY ||
        data.GROQ_API_KEY.trim() === '' ||
        data.GROQ_API_KEY === 'your_groq_api_key_here' ||
        data.GROQ_API_KEY === 'gsk_your_groq_api_key_here')
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'GROQ_API_KEY environment variable is required when MOCK_AI is false.',
        path: ['GROQ_API_KEY'],
      });
    }
  })
  .transform((data) => ({
    ...data,
    DATABASE_URL:
      data.DATABASE_URL ||
      (data.NODE_ENV === 'production'
        ? ''
        : 'postgresql://postgres:postgres@localhost:5432/meetingsummarizer?schema=public'),
    MOCK_AI: data.NODE_ENV === 'production' ? false : (data.MOCK_AI ?? false),
  }));

export const env = envSchema.parse(process.env);
