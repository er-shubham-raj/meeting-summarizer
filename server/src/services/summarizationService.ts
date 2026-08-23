import { env } from '../config/env.js';
import { MeetingSummaryZodType } from '../validators/summarySchema.js';
import { GroqLLMProvider } from './providers/groqLLMProvider.js';

export const MOCK_SUMMARY_DATA: MeetingSummaryZodType = {
  summary:
    'The team held a Q3 roadmap review covering database query performance, user onboarding UI improvements, and the mobile app beta release timeline. High query latency spikes were attributed to missing indexes, and onboarding usability testing highlighted user friction at the team invitation step. The mobile app beta was officially postponed by one week to accommodate stability fixes.',
  keyDecisions: [
    'Delay the mobile app beta launch by one week to September 12th to ensure database indexing and onboarding UI updates are fully verified in staging.',
    'Proceed with creating composite database indexes on the orders and users tables to resolve 800ms latency spikes.',
  ],
  actionItems: [
    {
      task: 'Complete composite database index migration and refactor legacy JOIN queries',
      owner: 'Bob Smith',
      deadline: '2026-08-28',
      priority: 'high',
    },
    {
      task: 'Update team invitation step UI wireframes and deliver Figma components',
      owner: 'Carol Williams',
      deadline: '2026-08-25',
      priority: 'medium',
    },
    {
      task: 'Review and validate staging environment post-index migration',
      owner: 'Dave',
      deadline: '2026-08-29',
      priority: 'medium',
    },
  ],
  importantPoints: [
    'Database latency during peak hours reached up to 800 milliseconds due to unindexed queries.',
    '80% of usability testing participants completed onboarding under 2 minutes, but invitation UX needs refinement.',
    'Targeting September 12th for the updated mobile app beta launch.',
  ],
};

export class SummarizationService {
  /**
   * Summarize transcript using Groq LLM (openai/gpt-oss-120b) into structured JSON.
   * NEVER returns MOCK_SUMMARY_DATA when MOCK_AI=false.
   */
  public static async summarizeTranscript(transcript: string): Promise<MeetingSummaryZodType> {
    if (!transcript || transcript.trim().length === 0) {
      throw new Error('Cannot generate summary from an empty transcript.');
    }

    if (env.MOCK_AI) {
      console.log(`[AI Mode] MOCK`);
      console.log(`[SummarizationService] MOCK_AI is explicitly enabled (MOCK_AI=true). Returning mock summary data.`);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return MOCK_SUMMARY_DATA;
    }

    // Real AI Mode (MOCK_AI = false)
    console.log(`[AI Mode] REAL`);
    console.log(`[SummarizationService] Generating meeting analysis using Groq LLM...`);

    const llmProvider = new GroqLLMProvider();
    return await llmProvider.summarize(transcript);
  }
}
