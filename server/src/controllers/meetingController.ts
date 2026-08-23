import { Request, Response, NextFunction } from 'express';
import { MeetingService } from '../services/meetingService.js';
import { AudioService } from '../services/audioService.js';
import { AppError } from '../middleware/errorMiddleware.js';
import { meetingIdParamSchema } from '../validators/meetingValidator.js';

export class MeetingController {
  /**
   * POST /api/meetings/upload
   * Handle audio file upload and trigger async background processing
   */
  public static uploadMeeting = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const file = req.file;
      if (!file) {
        throw new AppError('No audio file provided in request. Field name must be "audio".', 400);
      }

      // Audio validation check
      const validation = AudioService.validateAudioFile(file);
      if (!validation.valid) {
        // Cleanup file if invalid
        await AudioService.cleanupTempFile(file.path);
        throw new AppError(validation.error || 'Invalid audio file uploaded.', 400);
      }

      const customTitle = (req.body.title as string)?.trim();

      const meeting = await MeetingService.createMeeting({
        title: customTitle || file.originalname.replace(/\.[^/.]+$/, ''),
        originalFileName: file.originalname,
        fileType: file.mimetype || 'audio/unknown',
        fileSize: file.size,
        tempFilePath: file.path,
      });

      res.status(202).json({
        success: true,
        message: 'Meeting audio uploaded successfully. Processing started.',
        data: {
          id: meeting.id,
          title: meeting.title,
          originalFileName: meeting.originalFileName,
          status: meeting.status,
          createdAt: meeting.createdAt,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/meetings
   * Retrieve all meetings
   */
  public static getAllMeetings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const search = (req.query.search as string) || '';
      const meetings = await MeetingService.getAllMeetings(search);

      res.status(200).json({
        success: true,
        data: meetings,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/meetings/:id
   * Get complete details of a specific meeting
   */
  public static getMeetingById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = meetingIdParamSchema.parse(req.params);
      const meeting = await MeetingService.getMeetingById(id);

      if (!meeting) {
        throw new AppError(`Meeting with ID '${id}' not found.`, 404);
      }

      res.status(200).json({
        success: true,
        data: meeting,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/meetings/:id/status
   * Fast endpoint to check current processing status
   */
  public static getMeetingStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = meetingIdParamSchema.parse(req.params);
      const statusData = await MeetingService.getMeetingStatus(id);

      if (!statusData) {
        throw new AppError(`Meeting with ID '${id}' not found.`, 404);
      }

      res.status(200).json({
        success: true,
        data: statusData,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/meetings/:id/transcript
   * Get transcript of meeting
   */
  public static getMeetingTranscript = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = meetingIdParamSchema.parse(req.params);
      const meeting = await MeetingService.getMeetingById(id);

      if (!meeting) {
        throw new AppError(`Meeting with ID '${id}' not found.`, 404);
      }

      res.status(200).json({
        success: true,
        data: {
          id: meeting.id,
          title: meeting.title,
          status: meeting.status,
          transcript: meeting.transcript,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/meetings/:id/summary
   * Get structured summary, key decisions, action items, and important points
   */
  public static getMeetingSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = meetingIdParamSchema.parse(req.params);
      const meeting = await MeetingService.getMeetingById(id);

      if (!meeting) {
        throw new AppError(`Meeting with ID '${id}' not found.`, 404);
      }

      res.status(200).json({
        success: true,
        data: {
          id: meeting.id,
          title: meeting.title,
          status: meeting.status,
          summary: meeting.summary,
          keyDecisions: meeting.keyDecisions,
          actionItems: meeting.actionItems,
          importantPoints: meeting.importantPoints,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/meetings/:id
   * Delete meeting record
   */
  public static deleteMeeting = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = meetingIdParamSchema.parse(req.params);
      const deleted = await MeetingService.deleteMeeting(id);

      if (!deleted) {
        throw new AppError(`Meeting with ID '${id}' not found or could not be deleted.`, 404);
      }

      res.status(200).json({
        success: true,
        message: `Meeting '${id}' deleted successfully.`,
      });
    } catch (error) {
      next(error);
    }
  };
}
