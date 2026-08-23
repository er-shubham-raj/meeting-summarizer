import fs from 'fs';
import path from 'path';
import { env } from '../src/config/env.js';
import { GroqSpeechProvider } from '../src/services/providers/groqSpeechProvider.js';
import { GroqLLMProvider } from '../src/services/providers/groqLLMProvider.js';

async function testGroqPipeline() {
  console.log('====================================================');
  console.log('🔍 GROQ PROVIDER DIAGNOSTIC & API TEST');
  console.log('====================================================');

  const apiKey = env.GROQ_API_KEY?.trim() || '';
  const isApiKeyConfigured = apiKey.length > 0 && apiKey !== 'your_groq_api_key_here';

  console.log(`[Groq Diagnostic] API Key configured: ${isApiKeyConfigured}`);

  if (!isApiKeyConfigured) {
    console.error('❌ GROQ_CONNECTIVITY_FAILED: GROQ_API_KEY is missing or set to placeholder in .env!');
    console.error('👉 Please get a free API key at https://console.groq.com/keys and set GROQ_API_KEY in .env!');
    return;
  }

  // Generate 1s sample audio WAV file
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
  const samplePath = path.join(__dirname, 'groq_test.wav');
  fs.writeFileSync(samplePath, Buffer.concat([header, audioData]));

  try {
    // 1. Test Groq Speech-to-Text
    console.log('\n--- 1. TESTING GROQ SPEECH-TO-TEXT (whisper-large-v3-turbo) ---');
    const speechProvider = new GroqSpeechProvider();
    const transcript = await speechProvider.transcribe(samplePath, {
      originalFileName: 'groq_test.wav',
      mimeType: 'audio/wav',
    });
    console.log(`✅ GROQ TRANSCRIPTION SUCCESSFUL!`);
    console.log(`[Transcript]: "${transcript}"`);

    // 2. Test Groq LLM Summarization
    console.log('\n--- 2. TESTING GROQ LLM SUMMARIZATION (openai/gpt-oss-120b) ---');
    const llmProvider = new GroqLLMProvider();
    const testTranscriptText = "Hello, my name is Shubham Raj. Today we are reviewing the Q3 architecture updates for our meeting summarizer project.";
    const summary = await llmProvider.summarize(testTranscriptText);
    console.log(`✅ GROQ LLM SUMMARIZATION SUCCESSFUL!`);
    console.log(`[Executive Summary]:`, summary.summary);
    console.log(`[Key Decisions]:`, summary.keyDecisions);
    console.log(`[Action Items]:`, summary.actionItems);
    console.log(`[Important Points]:`, summary.importantPoints);

    console.log('\n====================================================');
    console.log('🎉 ALL GROQ API TESTS PASSED SUCCESSFULLY!');
    console.log('====================================================');
  } catch (err: any) {
    console.error(`❌ GROQ TEST FAILED:`, err?.message || err);
  } finally {
    if (fs.existsSync(samplePath)) {
      fs.unlinkSync(samplePath);
    }
  }
}

testGroqPipeline();
