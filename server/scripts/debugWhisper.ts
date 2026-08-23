import fs from 'fs';
import path from 'path';
import OpenAI, { toFile } from 'openai';
import { env } from '../src/config/env.js';
import { FfmpegService } from '../src/services/ffmpegService.js';

async function runDiagnostic() {
  console.log('====================================================');
  console.log('🔍 FULL DIAGNOSTIC TRACE FOR OPENAI TRANSCRIPTION');
  console.log('====================================================');

  const apiKey = env.OPENAI_API_KEY?.trim() || '';
  const isApiKeyConfigured = apiKey.length > 0 && apiKey !== 'your_openai_api_key_here';

  console.log(`[OpenAI] API key configured: ${isApiKeyConfigured}`);

  if (!isApiKeyConfigured) {
    console.error('❌ OPENAI_CONNECTIVITY_FAILED: OPENAI_API_KEY is missing or set to placeholder in .env!');
    return;
  }

  const openai = new OpenAI({
    apiKey,
    timeout: 60000, // 60s
    maxRetries: 2,
  });

  // STEP 1: Test basic model list API call
  console.log('\n--- STEP 1: TEST API CONNECTIVITY (openai.models.list) ---');
  try {
    const start = Date.now();
    const models = await openai.models.list();
    console.log(`✅ OPENAI_CONNECTIVITY_OK (${Date.now() - start}ms) - Total models: ${models.data.length}`);
  } catch (err: any) {
    console.error(`❌ OPENAI_CONNECTIVITY_FAILED:`);
    console.error(`  - Name: ${err?.name}`);
    console.error(`  - Message: ${err?.message}`);
    console.error(`  - Status: ${err?.status || err?.statusCode}`);
    console.error(`  - Code: ${err?.code}`);
    console.error(`  - Cause:`, err?.cause);
    return;
  }

  // STEP 2: Check uploads folder for any uploaded file to test actual upload
  console.log('\n--- STEP 2: TEST UPLOAD TRANSCRIPTION WITH ACTUAL FILE ---');
  const uploadsDir = path.resolve(__dirname, '../uploads');
  let testFile = '';

  if (fs.existsSync(uploadsDir)) {
    const files = fs.readdirSync(uploadsDir).filter((f) => f !== '.gitkeep');
    if (files.length > 0) {
      testFile = path.join(uploadsDir, files[files.length - 1]);
    }
  }

  if (!testFile || !fs.existsSync(testFile)) {
    console.log('[Diagnostic] No file found in uploads directory. Creating a sample audio file for diagnostic test...');
    // Create a 1 sec valid 44.1kHz mono PCM WAV file
    const header = Buffer.alloc(44);
    header.write('RIFF', 0);
    header.writeUInt32LE(36 + 88200, 4);
    header.write('WAVE', 8);
    header.write('fmt ', 12);
    header.writeUInt32LE(16, 16);
    header.writeUInt16LE(1, 20);
    header.writeUInt16LE(1, 22);
    header.writeUInt32LE(44100, 24);
    header.writeUInt32LE(88200, 28);
    header.writeUInt16LE(2, 32);
    header.writeUInt16LE(16, 34);
    header.write('data', 36);
    header.writeUInt32LE(88200, 40);

    const audioData = Buffer.alloc(88200);
    testFile = path.join(__dirname, 'diag_sample.wav');
    fs.writeFileSync(testFile, Buffer.concat([header, audioData]));
  }

  console.log(`[Diagnostic] Test file: ${testFile}`);
  console.log(`[Diagnostic] File exists: ${fs.existsSync(testFile)}`);
  const stats = fs.statSync(testFile);
  console.log(`[Diagnostic] File size: ${stats.size} bytes`);
  console.log(`[Diagnostic] Extension: ${path.extname(testFile)}`);

  // STEP 3: Test FFmpeg audio extraction if video
  let audioPath = testFile;
  let isExtracted = false;
  if (FfmpegService.isVideoOrNeedsExtraction('video/mp4', testFile)) {
    console.log('\n--- STEP 3: TEST FFMPEG EXTRACTION ---');
    try {
      console.log(`[FFmpeg] Starting extraction for: ${testFile}`);
      audioPath = await FfmpegService.extractAudio(testFile);
      isExtracted = true;
      const audioStats = fs.statSync(audioPath);
      console.log(`[FFmpeg] Completed successfully: ${audioPath} (${audioStats.size} bytes)`);
    } catch (ffmpegErr: any) {
      console.error(`[FFmpeg] Extraction failed: ${ffmpegErr?.message}`);
      return;
    }
  }

  // STEP 4: Send to OpenAI Whisper API
  console.log('\n--- STEP 4: SEND TO OPENAI WHISPER API ---');
  try {
    const fileBuffer = fs.readFileSync(audioPath);
    const fileName = path.basename(audioPath);
    console.log(`[OpenAI] Preparing uploadable file buffer: ${fileName} (${fileBuffer.length} bytes)...`);

    const fileObj = await toFile(fileBuffer, fileName, {
      type: fileName.endsWith('.wav') ? 'audio/wav' : 'audio/mp3',
    });

    console.log('[OpenAI] Request starting to openai.audio.transcriptions.create...');
    const start = Date.now();
    const result = await openai.audio.transcriptions.create({
      file: fileObj,
      model: 'whisper-1',
    });
    console.log(`✅ OPENAI TRANSCRIPTION SUCCESS in ${Date.now() - start}ms!`);
    console.log(`[OpenAI] Transcript: "${result.text}"`);
    console.log('====================================================');
  } catch (err: any) {
    console.error('❌ OPENAI TRANSCRIPTION REQUEST FAILED!');
    console.error('----------------------------------------------------');
    console.error(`error.name:             ${err?.name}`);
    console.error(`error.message:          ${err?.message}`);
    console.error(`HTTP Status:            ${err?.status || err?.statusCode || 'N/A'}`);
    console.error(`error.code:             ${err?.code || 'N/A'}`);
    console.error(`error.type:             ${err?.type || 'N/A'}`);
    console.error(`request ID:             ${err?.requestId || 'N/A'}`);
    console.error(`cause:                  ${err?.cause ? JSON.stringify(err.cause) : 'N/A'}`);
    if (err?.stack) {
      console.error(`stack: ${err.stack.split('\n').slice(0, 6).join('\n')}`);
    }
    console.log('====================================================');
  } finally {
    if (isExtracted && fs.existsSync(audioPath)) {
      fs.unlinkSync(audioPath);
    }
    if (testFile.endsWith('diag_sample.wav') && fs.existsSync(testFile)) {
      fs.unlinkSync(testFile);
    }
  }
}

runDiagnostic();
