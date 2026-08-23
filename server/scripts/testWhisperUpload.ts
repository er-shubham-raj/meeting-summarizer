import fs from 'fs';
import path from 'path';
import OpenAI, { toFile } from 'openai';
import { env } from '../src/config/env.js';

async function testWhisper() {
  console.log('====================================================');
  console.log('🔍 WHISPER TRANSCRIPTION BUFFER VS STREAM TEST');
  console.log('====================================================');

  const apiKey = env.OPENAI_API_KEY?.trim() || '';
  const openai = new OpenAI({
    apiKey,
    timeout: 60000,
    maxRetries: 3,
  });

  // Let's create a minimal 0.5 sec valid PCM WAV audio file with actual silent audio samples
  // 44100 Hz, 16-bit mono PCM = 44100 * 2 bytes/sec * 0.5s = 44100 bytes
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + 44100, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // Subchunk1Size
  header.writeUInt16LE(1, 20); // AudioFormat (PCM)
  header.writeUInt16LE(1, 22); // NumChannels (1)
  header.writeUInt32LE(44100, 24); // SampleRate
  header.writeUInt32LE(88200, 28); // ByteRate
  header.writeUInt16LE(2, 32); // BlockAlign
  header.writeUInt16LE(16, 34); // BitsPerSample
  header.write('data', 36);
  header.writeUInt32LE(44100, 40); // Subchunk2Size

  const audioData = Buffer.alloc(44100); // 0.5s silent audio samples
  const wavBuffer = Buffer.concat([header, audioData]);

  const testFilePath = path.join(__dirname, 'test_silent_05s.wav');
  fs.writeFileSync(testFilePath, wavBuffer);

  try {
    console.log(`[Test] Uploading real 0.5s WAV buffer (${wavBuffer.length} bytes) using toFile(fs.readFileSync)...`);
    const fileObj = await toFile(fs.readFileSync(testFilePath), 'test_silent_05s.wav', { type: 'audio/wav' });

    const startTime = Date.now();
    const response = await openai.audio.transcriptions.create({
      file: fileObj,
      model: 'whisper-1',
    });

    const duration = Date.now() - startTime;
    console.log(`✅ SUCCESS WITH BUFFER IN ${duration}ms!`);
    console.log(`[Test] Output text: "${response.text}"`);
    console.log('====================================================');
  } catch (error: any) {
    console.error('❌ BUFFER METHOD FAILED!');
    console.error(`Error Name:       ${error?.name}`);
    console.error(`Error Message:    ${error?.message}`);
    console.error(`HTTP Status:      ${error?.status || error?.statusCode}`);
    console.error(`Error Code:       ${error?.code}`);
    console.error(`Cause:            ${error?.cause ? JSON.stringify(error.cause) : 'N/A'}`);
    console.log('====================================================');
  } finally {
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }
  }
}

testWhisper();
