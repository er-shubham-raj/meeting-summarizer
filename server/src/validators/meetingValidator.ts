import { z } from 'zod';

export const meetingIdParamSchema = z.object({
  id: z.string().uuid('Invalid meeting ID format'),
});

export const meetingQuerySchema = z.object({
  search: z.string().optional(),
  status: z.enum(['UPLOADED', 'TRANSCRIBING', 'SUMMARIZING', 'COMPLETED', 'FAILED']).optional(),
  limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 20)),
  offset: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 0)),
});
