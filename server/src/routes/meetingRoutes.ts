import { Router } from 'express';
import { MeetingController } from '../controllers/meetingController.js';
import { uploadAudioMiddleware } from '../middleware/uploadMiddleware.js';
import { uploadLimiter } from '../middleware/rateLimitMiddleware.js';

const router = Router();

// Upload meeting audio with dedicated upload rate limiter
router.post('/upload', uploadLimiter, uploadAudioMiddleware, MeetingController.uploadMeeting);

// List all meetings
router.get('/', MeetingController.getAllMeetings);

// Get meeting by ID
router.get('/:id', MeetingController.getMeetingById);

// Get meeting status
router.get('/:id/status', MeetingController.getMeetingStatus);

// Get meeting transcript
router.get('/:id/transcript', MeetingController.getMeetingTranscript);

// Get meeting summary
router.get('/:id/summary', MeetingController.getMeetingSummary);

// Delete meeting
router.delete('/:id', MeetingController.deleteMeeting);

export default router;
