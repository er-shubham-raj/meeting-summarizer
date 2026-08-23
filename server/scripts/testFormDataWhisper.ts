import fs from 'fs';
import path from 'path';
import https from 'https';
import { env } from '../src/config/env.js';

async function testFormDataUpload() {
  console.log('====================================================');
  console.log('🔍 WHISPER TRANSCRIPTION FORMDATA STREAM TEST');
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
  const testFilePath = path.join(__dirname, 'test_fd.wav');
  fs.writeFileSync(testFilePath, wavBuffer);

  const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);

  let bodyHeader = '';
  bodyHeader += `--${boundary}\r\n`;
  bodyHeader += `Content-Disposition: form-data; name="model"\r\n\r\n`;
  bodyHeader += `whisper-1\r\n`;

  bodyHeader += `--${boundary}\r\n`;
  bodyHeader += `Content-Disposition: form-data; name="file"; filename="test_fd.wav"\r\n`;
  bodyHeader += `Content-Type: audio/wav\r\n\r\n`;

  const bodyFooter = `\r\n--${boundary}--\r\n`;

  const payload = Buffer.concat([
    Buffer.from(bodyHeader, 'utf-8'),
    wavBuffer,
    Buffer.from(bodyFooter, 'utf-8'),
  ]);

  console.log(`[FormDataTest] Sending ${payload.length} bytes to https://api.openai.com/v1/audio/transcriptions...`);

  return new Promise<void>((resolve, reject) => {
    const req = https.request(
      'https://api.openai.com/v1/audio/transcriptions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': payload.length,
        },
        timeout: 30000,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          console.log(`✅ HTTP STATUS CODE: ${res.statusCode}`);
          console.log(`[Response Data]: ${data}`);
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            console.log('✅ WHISPER UPLOAD SUCCESSFUL!');
          } else {
            console.error('❌ OPENAI RETURNED ERROR STATUS:', res.statusCode);
          }
          resolve();
        });
      }
    );

    req.on('error', (err) => {
      console.error('❌ REQUEST ERROR:', err);
      reject(err);
    });

    req.write(payload);
    req.end();
  }).finally(() => {
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }
  });
}

testFormDataUpload();
