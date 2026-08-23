import fs from 'fs';
import path from 'path';
import { env } from '../config/env.js';
import { FfmpegService } from './ffmpegService.js';
import { AudioService } from './audioService.js';
import { GroqSpeechProvider } from './providers/groqSpeechProvider.js';
import { FileMetadata } from './providers/speechProvider.interface.js';

export const MOCK_TRANSCRIPT = `
Alice Johnson (Product Lead): Good morning team. Let's start our quarterly roadmap review for Q3. We have three main items on the agenda: the new user onboarding flow, database query performance, and the upcoming mobile app beta launch.

Bob Smith (Engineering Lead): Thanks Alice. On the database performance front, we noticed latency spikes up to 800 milliseconds during peak hours last week. Our team investigated and found we need to add composite indexes on the orders and users tables, and refactor two legacy JOIN queries.

Carol Williams (UX Designer): For onboarding, the wireframes are completed. We ran usability testing with 15 users last Tuesday. 80% completed the onboarding in under 2 minutes, but users struggled with the workspace invitation step.

Alice Johnson: Great feedback. Bob, how long will the database index migration take?

Bob Smith: We can complete the migration by next Thursday, August 28th. Dave will handle the migration script and staging validation.

Alice Johnson: Perfect. Carol, can you update the invitation step UI to clarify team permissions?

Carol Williams: Yes, I will deliver updated Figma components by Monday, August 25th.

Alice Johnson: Awesome. Decision: We are officially delaying the mobile app beta by one week to September 12th to ensure the onboarding and database fixes are fully deployed and verified.

Bob Smith: Agreed. That gives us sufficient testing buffer.

Alice Johnson: To wrap up, Bob is owning database optimization by Aug 28th, Carol is handling the onboarding UI updates by Aug 25th, and Dave will review staging by Aug 29th. Thanks everyone!
`.trim();

export { FileMetadata };

export class TranscriptionService {
  /**
   * Transcribe actual speech audio/video file to text using Groq Whisper API (whisper-large-v3-turbo).
   * NEVER returns MOCK_TRANSCRIPT when MOCK_AI=false.
   */
  public static async transcribeAudio(filePath: string, fileMeta?: FileMetadata): Promise<string> {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Uploaded file not found on disk at path: ${filePath}`);
    }

    const fileName = fileMeta?.originalFileName || path.basename(filePath);
    const mimeType = fileMeta?.mimeType || 'audio/mpeg';

    // Check AI Mode
    if (env.MOCK_AI) {
      console.log(`[AI Mode] MOCK`);
      console.log(`[Transcription] MOCK_AI is explicitly enabled (MOCK_AI=true). Returning mock transcript.`);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return MOCK_TRANSCRIPT;
    }

    // Real AI Mode (MOCK_AI = false)
    console.log(`[AI Mode] REAL`);
    console.log(`[Transcription] Input filename: ${fileName}`);
    console.log(`[Transcription] MIME type: ${mimeType}`);

    let targetAudioPath = filePath;
    let extractedTempAudioPath: string | null = null;
    const needsExtraction = FfmpegService.isVideoOrNeedsExtraction(mimeType, fileName);

    console.log(`[Transcription] Audio extraction required: ${needsExtraction}`);

    try {
      if (needsExtraction) {
        console.log(`[FFmpeg] Starting extraction for: ${filePath}`);
        extractedTempAudioPath = await FfmpegService.extractAudio(filePath);
        targetAudioPath = extractedTempAudioPath;

        const extractedExists = fs.existsSync(targetAudioPath);
        const extractedStats = extractedExists ? fs.statSync(targetAudioPath) : null;
        console.log(`[FFmpeg] Extraction completed: ${targetAudioPath} (${extractedStats?.size || 0} bytes)`);

        if (!extractedExists || (extractedStats && extractedStats.size === 0)) {
          throw new Error('FFmpeg audio extraction produced a 0-byte or nonexistent file.');
        }
      }

      // Delegate real transcription to GroqSpeechProvider
      const speechProvider = new GroqSpeechProvider();
      const transcriptText = await speechProvider.transcribe(targetAudioPath, fileMeta);

      if (!transcriptText || transcriptText.trim().length === 0) {
        throw new Error('The uploaded media could not be transcribed (Speech provider returned empty text).');
      }

      return transcriptText.trim();
    } catch (error: any) {
      console.error('[Transcription] Processing Error:', error?.message || error);
      // NEVER return MOCK_TRANSCRIPT on error when MOCK_AI=false
      throw error;
    } finally {
      if (extractedTempAudioPath) {
        await AudioService.cleanupTempFile(extractedTempAudioPath);
      }
    }
  }
}
