import { env } from '../src/config/env.js';
import OpenAI from 'openai';

async function runDiagnostic() {
  console.log('====================================================');
  console.log('🔍 OPENAI API DIAGNOSTIC TEST');
  console.log('====================================================');

  const apiKey = env.OPENAI_API_KEY?.trim() || '';
  const hasKey = apiKey.length > 0 && apiKey !== 'your_openai_api_key_here';
  const keyLength = apiKey.length;
  const keyPrefix = hasKey ? `${apiKey.substring(0, 7)}...${apiKey.substring(apiKey.length - 4)}` : 'NONE/PLACEHOLDER';

  console.log(`[Diagnostic] MOCK_AI: ${env.MOCK_AI}`);
  console.log(`[Diagnostic] OPENAI_API_KEY configured: ${hasKey}`);
  console.log(`[Diagnostic] Key length: ${keyLength} chars`);
  console.log(`[Diagnostic] Key preview: ${keyPrefix}`);
  console.log(`[Diagnostic] Target URL: https://api.openai.com/v1/models`);
  console.log('----------------------------------------------------');

  if (!hasKey) {
    console.error('❌ FAIL: OPENAI_API_KEY is not set or still set to placeholder in .env!');
    console.log('====================================================');
    return;
  }

  try {
    const openai = new OpenAI({ apiKey, timeout: 15000 });
    console.log('[Diagnostic] Initiating test call: openai.models.list()...');
    const startTime = Date.now();

    const response = await openai.models.list();
    const duration = Date.now() - startTime;

    console.log(`✅ SUCCESS: OpenAI API reached successfully in ${duration}ms!`);
    console.log(`[Diagnostic] Total models available: ${response.data.length}`);
    const whisperModel = response.data.find((m) => m.id === 'whisper-1');
    const gpt4oMiniModel = response.data.find((m) => m.id === 'gpt-4o-mini');

    console.log(`[Diagnostic] whisper-1 model accessible: ${!!whisperModel}`);
    console.log(`[Diagnostic] gpt-4o-mini model accessible: ${!!gpt4oMiniModel}`);
    console.log('====================================================');
  } catch (error: any) {
    console.error('❌ FAIL: OpenAI API Call Failed!');
    console.error('----------------------------------------------------');
    console.error(`Error Name:       ${error?.name || 'UnknownError'}`);
    console.error(`Error Message:    ${error?.message || 'No message provided'}`);
    console.error(`HTTP Status:      ${error?.status || error?.statusCode || 'N/A'}`);
    console.error(`Error Code:       ${error?.code || 'N/A'}`);
    console.error(`Error Type:       ${error?.type || 'N/A'}`);
    console.error(`Request ID:       ${error?.requestId || error?.headers?.['x-request-id'] || 'N/A'}`);
    console.error(`Cause/Underlying: ${error?.cause ? JSON.stringify(error.cause) : 'N/A'}`);
    if (error?.stack) {
      console.error(`Stack trace snippet: ${error.stack.split('\n').slice(0, 5).join('\n')}`);
    }
    console.log('====================================================');
  }
}

runDiagnostic();
