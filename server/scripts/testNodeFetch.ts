import fs from 'fs';
import path from 'path';
import https from 'https';
import { env } from '../src/config/env.js';

async function testHttpsModule() {
  console.log('====================================================');
  console.log('🔍 DIRECT NODE HTTPS MODULE WHISPER TEST');
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

  const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);

  let body = '';
  // Field model
  body += `--${boundary}\r\n`;
  body += `Content-Disposition: form-data; name="model"\r\n\r\n`;
  body += `whisper-1\r\n`;

  // File header
  body += `--${boundary}\r\n`;
  body += `Content-Disposition: form-data; name="file"; filename="test.wav"\r\n`;
  body += `Content-Type: audio/wav\r\n\r\n`;

  const footer = `\r\n--${boundary}--\r\n`;

  const bodyBuffer = Buffer.concat([
    Buffer.from(body, 'utf-8'),
    wavBuffer,
    Buffer.from(footer, 'utf-8'),
  ]);

  console.log(`[HttpsTest] Prepared multipart payload total bytes: ${bodyBuffer.length}`);

  const options: https.RequestOptions = {
    hostname: 'api.openai.com',
    port: 443,
    path: '/v1/audio/transcriptions',
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'Content-Length': bodyBuffer.length,
      Connection: 'keep-alive',
    },
    timeout: 30000,
  };

  const startTime = Date.now();

  const req = https.request(options, (res) => {
    let responseData = '';
    res.on('data', (chunk) => {
      responseData += chunk;
    });

    res.on('end', () => {
      const duration = Date.now() - startTime;
      console.log(`✅ NODE HTTPS MODULE SUCCESS in ${duration}ms!`);
      console.log(`[HttpsTest] Status Code: ${res.statusCode}`);
      console.log(`[HttpsTest] Response Data: ${responseData}`);
      console.log('====================================================');
    });
  });

  req.on('error', (err) => {
    console.error('❌ NODE HTTPS MODULE FAILED!');
    console.error(`Error Code:    ${(err as any).code}`);
    console.error(`Error Message: ${err.message}`);
    console.log('====================================================');
  });

  req.write(bodyBuffer);
  req.end();
}

testHttpsModule();
