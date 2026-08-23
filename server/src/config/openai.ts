import OpenAI from 'openai';
import { env } from './env.js';

export const getOpenAIClient = (): OpenAI => {
  const apiKey = env.OPENAI_API_KEY?.trim();
  const isPlaceholderKey = !apiKey || apiKey === '' || apiKey === 'your_openai_api_key_here';

  if (!env.MOCK_AI && isPlaceholderKey) {
    throw new Error(
      'OPENAI_API_KEY is missing or unconfigured while MOCK_AI is set to false. Please provide a valid OpenAI API key in environment variables.'
    );
  }

  return new OpenAI({
    apiKey: apiKey || 'mock-key',
  });
};
