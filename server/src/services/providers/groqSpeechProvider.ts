import fs from 'fs';
import path from 'path';
import Groq from 'groq-sdk';
import { env } from '../../config/env.js';
import { ISpeechToTextProvider, FileMetadata } from './speechProvider.interface.js';

export class GroqSpeechProvider implements ISpeechToTextProvider {
  public async transcribe(filePath: string, fileMeta?: FileMetadata): Promise<string> {
    const startTime = Date.now();

    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found on disk for Groq transcription: ${filePath}`);
    }

    const apiKey = env.GROQ_API_KEY?.trim();
    const isApiKeyConfigured = !!apiKey && apiKey !== '' && apiKey !== 'your_groq_api_key_here';

    console.log(`[GroqSTT] API key configured: ${isApiKeyConfigured}`);

    if (!isApiKeyConfigured) {
      console.error(`[GroqSTT] Error: GROQ_API_KEY is unconfigured in .env file.`);
      throw new Error(
        'Groq API key is not configured. Please set a valid GROQ_API_KEY in your .env file.'
      );
    }

    const stats = fs.statSync(filePath);
    const fileName = fileMeta?.originalFileName || path.basename(filePath);

    console.log(`[GroqSTT] Request starting for file: ${fileName}`);
    console.log(`[GroqSTT] Model: whisper-large-v3-turbo`);
    console.log(`[GroqSTT] File size: ${stats.size} bytes`);
    console.log(`[GroqSTT] Extension: ${path.extname(filePath)}`);

    try {
      const groq = new Groq({ apiKey });
      const fileStream = fs.createReadStream(filePath);

      const response = await groq.audio.transcriptions.create({
        file: fileStream,
        model: 'whisper-large-v3-turbo',
        response_format: 'json',
      });

      const durationMs = Date.now() - startTime;
      console.log(`[GroqSTT] Request completed successfully in ${durationMs}ms`);

      if (!response.text || response.text.trim().length === 0) {
        throw new Error('Groq transcription returned empty text for the uploaded media.');
      }

      return response.text.trim();
    } catch (error: any) {
      const status = error?.status || error?.statusCode;
      const code = error?.code || error?.error?.code;
      const message = error?.message || error?.error?.message || 'Unknown Groq API error';

      console.error('[GroqSTT Error Diagnostics]:');
      console.error(`  - Name: ${error?.name}`);
      console.error(`  - HTTP Status: ${status || 'N/A'}`);
      console.error(`  - Error Code: ${code || 'N/A'}`);
      console.error(`  - Message: ${message}`);

      let userMsg = message;
      if (status === 401 || code === 'invalid_api_key') {
        userMsg = 'Groq authentication failed (HTTP 401 Unauthorized). Please check your GROQ_API_KEY in .env.';
      } else if (status === 429 || code === 'rate_limit_exceeded') {
        userMsg = 'Groq API rate limit reached (HTTP 429). Please wait a few seconds and try again.';
      } else if (status === 400) {
        userMsg = `Groq could not transcribe the audio file: ${message}`;
      } else if (code === 'ECONNRESET' || code === 'ETIMEDOUT' || code === 'ENOTFOUND') {
        userMsg = `Unable to connect to Groq API network (${code}). Please check your internet connection.`;
      }

      throw new Error(`Speech-to-text transcription failed: ${userMsg}`);
    }
  }
}
