import fs from 'fs';
import path from 'path';
import axios from 'axios';
import FormData from 'form-data';
import { env } from '../src/config/env.js';
import { toFile } from 'openai';

async function testDirect() {
  console.log('====================================================');
  console.log('🔍 DIRECT MULTIPART FORMDATA WHISPER TEST');
  console.log('====================================================');

  const apiKey = env.OPENAI_API_KEY?.trim() || '';

  // 1 sec silence WAV
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
  const wavBuffer = Buffer.concat([header, audioData]);
  const testFilePath = path.join(__dirname, 'test_direct.wav');
  fs.writeFileSync(testFilePath, wavBuffer);

  try {
    console.log('[DirectTest] Preparing FormData with explicit Content-Length...');
    const formData = new FormData();
    formData.append('file', fs.createReadStream(testFilePath), {
      filename: 'test_direct.wav',
      contentType: 'audio/wav',
      knownLength: wavBuffer.length,
    });
    formData.append('model', 'whisper-1');

    console.log('[DirectTest] Posting to https://api.openai.com/v1/audio/transcriptions via Axios...');
    const startTime = Date.now();

    const response = await axios.post('https://api.openai.com/v1/audio/transcriptions', formData, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        ...formData.getHeaders(),
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      timeout: 30000,
    });

    const duration = Date.now() - startTime;
    console.log(`✅ AXIOS DIRECT MULTIPART SUCCESS in ${duration}ms!`);
    console.log(`[DirectTest] Response data:`, response.data);
    console.log('====================================================');
  } catch (error: any) {
    console.error('❌ DIRECT MULTIPART FAILED!');
    console.error(`Error Name:       ${error?.name}`);
    console.error(`Error Message:    ${error?.message}`);
    console.error(`HTTP Status:      ${error?.response?.status || error?.status}`);
    console.error(`Response Data:    ${JSON.stringify(error?.response?.data || {})}`);
    console.error(`Cause/Code:       ${error?.code}`);
    console.log('====================================================');
  } finally {
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }
  }
}

testDirect();
