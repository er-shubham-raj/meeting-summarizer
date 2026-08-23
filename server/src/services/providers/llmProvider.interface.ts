import { MeetingSummaryZodType } from '../../validators/summarySchema.js';

export interface ILLMProvider {
  summarize(transcript: string): Promise<MeetingSummaryZodType>;
}
