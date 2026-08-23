import { prisma } from '../config/db.js';
import { MeetingStatus, MeetingRecord } from '../types/meeting.js';
import { AudioService } from './audioService.js';
import { TranscriptionService } from './transcriptionService.js';
import { SummarizationService } from './summarizationService.js';
import { AppError } from '../middleware/errorMiddleware.js';

export class MeetingService {
  /**
   * Helper to verify database connectivity with fast timeout
   */
  public static async verifyDatabaseConnection(): Promise<void> {
    try {
      const queryPromise = prisma.$queryRaw`SELECT 1`;
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Database connection timed out')), 2000)
      );

      await Promise.race([queryPromise, timeoutPromise]);
    } catch (err: any) {
      console.error('[MeetingService] Database connection check failed:', err?.message || err);
      throw new AppError(
        'Database unavailable. Please ensure PostgreSQL is running at localhost:5432 and the meetingsummarizer database exists.',
        503
      );
    }
  }

  /**
   * Create meeting initial record strictly in PostgreSQL DB.
   * Fails immediately without in-memory fallback if PostgreSQL is unavailable.
   */
  public static async createMeeting(data: {
    title: string;
    originalFileName: string;
    fileType: string;
    fileSize: number;
    tempFilePath: string;
  }): Promise<MeetingRecord> {
    const meetingId = crypto.randomUUID();

    let createdRecord: any;
    try {
      createdRecord = await prisma.meeting.create({
        data: {
          id: meetingId,
          title: data.title || data.originalFileName.replace(/\.[^/.]+$/, ''),
          originalFileName: data.originalFileName,
          fileType: data.fileType,
          fileSize: data.fileSize,
          status: MeetingStatus.UPLOADED,
        },
      });
    } catch (dbErr: any) {
      console.error('[MeetingService] PostgreSQL meeting creation failed:', dbErr?.message || dbErr);
      // Clean up uploaded temp file immediately if DB creation fails
      await AudioService.cleanupTempFile(data.tempFilePath);
      throw new AppError(
        'Database unavailable. Failed to persist meeting record in PostgreSQL.',
        503
      );
    }

    const record: MeetingRecord = createdRecord as MeetingRecord;

    // Trigger async background processing without blocking caller
    this.processMeetingAsync(record.id, data.tempFilePath).catch((err) => {
      console.error(`[MeetingService] Background process unhandled error for ${record.id}:`, err);
    });

    return record;
  }

  /**
   * Background pipeline execution (Updates PostgreSQL state)
   */
  private static async processMeetingAsync(meetingId: string, tempFilePath: string): Promise<void> {
    console.log(`[MeetingService] Starting async pipeline for meeting: ${meetingId}`);

    try {
      const meeting = await this.getMeetingById(meetingId);
      if (!meeting) {
        throw new Error(`Meeting record ${meetingId} not found in database.`);
      }

      // Stage 1: STT Transcription
      await this.updateStatus(meetingId, MeetingStatus.TRANSCRIBING);
      const transcript = await TranscriptionService.transcribeAudio(tempFilePath, {
        originalFileName: meeting.originalFileName,
        mimeType: meeting.fileType,
        fileSize: meeting.fileSize,
      });
      await this.updateMeetingFields(meetingId, { transcript });

      // Stage 2: LLM Summarization
      await this.updateStatus(meetingId, MeetingStatus.SUMMARIZING);
      const summaryData = await SummarizationService.summarizeTranscript(transcript);

      // Stage 3: Store Structured Results & Complete
      await this.updateMeetingFields(meetingId, {
        summary: summaryData.summary,
        keyDecisions: summaryData.keyDecisions,
        actionItems: summaryData.actionItems,
        importantPoints: summaryData.importantPoints,
        status: MeetingStatus.COMPLETED,
      });

      console.log(`[MeetingService] Meeting ${meetingId} pipeline completed successfully.`);
    } catch (error: any) {
      console.error(`[MeetingService] Meeting ${meetingId} processing failed:`, error?.message || error);
      await this.updateMeetingFields(meetingId, {
        status: MeetingStatus.FAILED,
        errorMessage: error?.message || 'Processing failed due to an error.',
      });
    } finally {
      // Stage 4: Cleanup temporary audio file after processing attempt
      await AudioService.cleanupTempFile(tempFilePath);
    }
  }

  /**
   * Update status helper
   */
  public static async updateStatus(id: string, status: MeetingStatus): Promise<void> {
    await this.updateMeetingFields(id, { status });
  }

  /**
   * Update arbitrary fields in PostgreSQL strictly
   */
  public static async updateMeetingFields(id: string, fields: Partial<MeetingRecord>): Promise<void> {
    const updatedData: any = { ...fields, updatedAt: new Date() };

    try {
      await prisma.meeting.update({
        where: { id },
        data: updatedData,
      });
    } catch (err: any) {
      console.error(`[MeetingService] PostgreSQL update failed for meeting ${id}:`, err?.message || err);
      throw err;
    }
  }

  /**
   * List all meetings strictly from PostgreSQL
   */
  public static async getAllMeetings(search?: string): Promise<MeetingRecord[]> {
    try {
      const whereClause = search
        ? {
            OR: [
              { title: { contains: search, mode: 'insensitive' as const } },
              { originalFileName: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {};

      return (await prisma.meeting.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
      })) as MeetingRecord[];
    } catch (err: any) {
      console.error('[MeetingService] PostgreSQL getAllMeetings failed:', err?.message || err);
      throw new AppError('Database unavailable. Could not fetch meetings from PostgreSQL.', 503);
    }
  }

  /**
   * Get meeting by ID strictly from PostgreSQL
   */
  public static async getMeetingById(id: string): Promise<MeetingRecord | null> {
    try {
      const record = await prisma.meeting.findUnique({ where: { id } });
      return record as MeetingRecord | null;
    } catch (err: any) {
      console.error(`[MeetingService] PostgreSQL getMeetingById failed for ${id}:`, err?.message || err);
      throw new AppError('Database unavailable.', 503);
    }
  }

  /**
   * Get status only strictly from PostgreSQL
   */
  public static async getMeetingStatus(id: string): Promise<{ status: string; errorMessage?: string | null } | null> {
    const meeting = await this.getMeetingById(id);
    if (!meeting) return null;
    return {
      status: meeting.status,
      errorMessage: meeting.errorMessage,
    };
  }

  /**
   * Delete meeting strictly from PostgreSQL
   */
  public static async deleteMeeting(id: string): Promise<boolean> {
    try {
      await prisma.meeting.delete({ where: { id } });
      return true;
    } catch (err: any) {
      console.error(`[MeetingService] PostgreSQL deleteMeeting failed for ${id}:`, err?.message || err);
      return false;
    }
  }
}
