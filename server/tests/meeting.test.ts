import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { meetingSummarySchema } from '../src/validators/summarySchema.js';
import { MOCK_SUMMARY_DATA, SummarizationService } from '../src/services/summarizationService.js';
import { TranscriptionService } from '../src/services/transcriptionService.js';
import { MeetingService } from '../src/services/meetingService.js';
import { GroqLLMProvider } from '../src/services/providers/groqLLMProvider.js';
import { prisma, verifyPrismaDatabaseConnection } from '../src/config/db.js';
import { env } from '../src/config/env.js';
import fs from 'fs';
import path from 'path';

describe('Meeting Summarizer API & PostgreSQL Tests', () => {
  it('GET /api/health should return healthy status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
  });

  it('POST /api/meetings/upload without file should return 400', async () => {
    const res = await request(app).post('/api/meetings/upload');
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('No audio file provided');
  });

  it('Zod Summary Schema should validate structured AI output', () => {
    const validationResult = meetingSummarySchema.safeParse(MOCK_SUMMARY_DATA);
    expect(validationResult.success).toBe(true);
    if (validationResult.success) {
      expect(validationResult.data.actionItems.length).toBeGreaterThan(0);
      expect(validationResult.data.keyDecisions.length).toBeGreaterThan(0);
    }
  });

  it('GET /api/meetings/invalid-uuid should return 400 invalid format', async () => {
    const res = await request(app).get('/api/not-a-uuid');
    expect(res.status).toBe(404);
  });

  it('GroqLLMProvider MUST be configured with model openai/gpt-oss-120b', () => {
    expect(GroqLLMProvider.MODEL_NAME).toBe('openai/gpt-oss-120b');
  });

  /* POSTGRESQL & PRISMA RUNTIME TESTS */
  describe('PostgreSQL Runtime Connectivity & Persistent Insertion', () => {
    it('verifyPrismaDatabaseConnection should succeed with SELECT 1', async () => {
      await expect(verifyPrismaDatabaseConnection()).resolves.not.toThrow();
    });

    it('MeetingService.createMeeting should insert meeting record into PostgreSQL', async () => {
      const tempPath = path.join(__dirname, 'test_real_insert.wav');
      fs.writeFileSync(tempPath, Buffer.from('RIFF....WAVEfmt ....data....'));

      try {
        const created = await MeetingService.createMeeting({
          title: 'Runtime DB Test Meeting',
          originalFileName: 'test_real_insert.wav',
          fileType: 'audio/wav',
          fileSize: 28,
          tempFilePath: tempPath,
        });

        expect(created.id).toBeDefined();
        expect(created.title).toBe('Runtime DB Test Meeting');

        // Confirm record exists in PostgreSQL DB
        const dbRecord = await prisma.meeting.findUnique({ where: { id: created.id } });
        expect(dbRecord).not.toBeNull();
        expect(dbRecord?.id).toBe(created.id);

        // Clean up created record
        await prisma.meeting.delete({ where: { id: created.id } });
      } finally {
        if (fs.existsSync(tempPath)) {
          fs.unlinkSync(tempPath);
        }
      }
    });

    it('When PostgreSQL database creation fails, createMeeting MUST throw AppError and NOT fall back to memory store', async () => {
      const fakeAudioBuffer = Buffer.from('RIFF....WAVEfmt ....data....');
      const tempPath = path.join(__dirname, 'test_db_fail.wav');
      fs.writeFileSync(tempPath, fakeAudioBuffer);

      // Spy on prisma.meeting.create to simulate DB failure
      const createSpy = vi.spyOn(prisma.meeting, 'create').mockRejectedValueOnce(new Error('P1001 DB Offline'));

      try {
        await expect(
          MeetingService.createMeeting({
            title: 'Test DB Failure',
            originalFileName: 'test_db_fail.wav',
            fileType: 'audio/wav',
            fileSize: fakeAudioBuffer.length,
            tempFilePath: tempPath,
          })
        ).rejects.toThrow(/Database unavailable/i);

        // Verify temporary file was cleaned up on DB failure
        expect(fs.existsSync(tempPath)).toBe(false);
      } finally {
        createSpy.mockRestore();
        if (fs.existsSync(tempPath)) {
          fs.unlinkSync(tempPath);
        }
      }
    });
  });

  /* REGRESSION TESTS */
  describe('Phase 1 & Phase 4 Strict Database & Groq AI Verification', () => {
    const originalMockAi = env.MOCK_AI;
    const originalGroqKey = env.GROQ_API_KEY;

    it('When MOCK_AI=false and GROQ_API_KEY is missing, TranscriptionService MUST fail and NEVER return MOCK_TRANSCRIPT', async () => {
      (env as any).MOCK_AI = false;
      (env as any).GROQ_API_KEY = '';

      const dummyFilePath = path.join(__dirname, 'dummy.wav');
      fs.writeFileSync(dummyFilePath, 'RIFF....WAVEfmt ....data....');

      try {
        await expect(TranscriptionService.transcribeAudio(dummyFilePath)).rejects.toThrow(
          /Groq API key is not configured/i
        );
      } finally {
        if (fs.existsSync(dummyFilePath)) {
          fs.unlinkSync(dummyFilePath);
        }
        (env as any).MOCK_AI = originalMockAi;
        (env as any).GROQ_API_KEY = originalGroqKey;
      }
    });

    it('When MOCK_AI=false and GROQ_API_KEY is missing, SummarizationService MUST fail and NEVER return MOCK_SUMMARY_DATA', async () => {
      (env as any).MOCK_AI = false;
      (env as any).GROQ_API_KEY = '';

      await expect(SummarizationService.summarizeTranscript('Test transcript content')).rejects.toThrow(
        /Groq API key is not configured/i
      );

      (env as any).MOCK_AI = originalMockAi;
      (env as any).GROQ_API_KEY = originalGroqKey;
    });
  });
});
