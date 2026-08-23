import { z } from 'zod';

export const actionItemSchema = z.object({
  task: z.string().min(1, 'Task description cannot be empty'),
  owner: z.string().nullable(),
  deadline: z.string().nullable(),
  priority: z.enum(['high', 'medium', 'low']).default('medium'),
});

export const meetingSummarySchema = z.object({
  summary: z.string().min(10, 'Summary must be at least 10 characters long'),
  keyDecisions: z.array(z.string()),
  actionItems: z.array(actionItemSchema),
  importantPoints: z.array(z.string()),
});

export type MeetingSummaryZodType = z.infer<typeof meetingSummarySchema>;
