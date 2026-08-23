import Groq from 'groq-sdk';
import { env } from '../../config/env.js';
import { ILLMProvider } from './llmProvider.interface.js';
import { meetingSummarySchema, MeetingSummaryZodType } from '../../validators/summarySchema.js';

const GROQ_SYSTEM_PROMPT = `
You are an expert AI meeting analyst.
Given a raw meeting transcript, extract structured insights into JSON format.

Required JSON Structure:
{
  "summary": "High-level executive summary of the discussion (2-4 sentences)",
  "keyDecisions": ["List of explicit decisions made"],
  "actionItems": [
    {
      "task": "Specific actionable task description",
      "owner": "Person name or null/Unassigned if not explicitly named in transcript",
      "deadline": "YYYY-MM-DD date or null if not explicitly mentioned",
      "priority": "low" | "medium" | "high"
    }
  ],
  "importantPoints": ["Key discussion points, topics, or metrics"]
}

CRITICAL ACCURACY RULES:
1. Do NOT invent, hallucinate, or assume owners, deadlines, or decisions not present in the text.
2. If a task has no explicitly named owner in the transcript, set owner to null or "Unassigned".
3. If a task has no deadline mentioned in the transcript, set deadline to null.
4. Return only valid JSON adhering strictly to the schema.
`.trim();

export class GroqLLMProvider implements ILLMProvider {
  public static readonly MODEL_NAME = 'openai/gpt-oss-120b';

  public async summarize(transcript: string): Promise<MeetingSummaryZodType> {
    const startTime = Date.now();

    if (!transcript || transcript.trim().length === 0) {
      throw new Error('Cannot generate summary from an empty transcript.');
    }

    const apiKey = env.GROQ_API_KEY?.trim();
    const isApiKeyConfigured = !!apiKey && apiKey !== '' && apiKey !== 'your_groq_api_key_here';

    console.log(`[GroqLLM] API key configured: ${isApiKeyConfigured}`);

    if (!isApiKeyConfigured) {
      console.error(`[GroqLLM] Error: GROQ_API_KEY is unconfigured in .env file.`);
      throw new Error(
        'Groq API key is not configured. Please set a valid GROQ_API_KEY in your .env file.'
      );
    }

    console.log(`[GroqLLM] Analyzing transcript length: ${transcript.length} chars`);
    console.log(`[GroqLLM] Model: ${GroqLLMProvider.MODEL_NAME}`);

    try {
      const groq = new Groq({ apiKey });

      const completion = await groq.chat.completions.create({
        model: GroqLLMProvider.MODEL_NAME,
        messages: [
          { role: 'system', content: GROQ_SYSTEM_PROMPT },
          { role: 'user', content: `TRANSCRIPT:\n${transcript}` },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1,
      });

      const durationMs = Date.now() - startTime;
      console.log(`[GroqLLM] Analysis finished in ${durationMs}ms`);

      const rawJsonContent = completion.choices[0]?.message?.content;
      if (!rawJsonContent) {
        throw new Error('Groq LLM response content was empty.');
      }

      // Parse JSON
      let parsedJson: unknown;
      try {
        parsedJson = JSON.parse(rawJsonContent);
      } catch {
        console.error('[GroqLLM] Failed to parse JSON response:', rawJsonContent);
        throw new Error('Groq LLM response was not valid JSON.');
      }

      // Validate with Zod schema
      const validationResult = meetingSummarySchema.safeParse(parsedJson);
      if (!validationResult.success) {
        console.error('[GroqLLM] Zod validation failed:', validationResult.error.format());
        throw new Error(
          `LLM summary validation failed: ${validationResult.error.issues.map((i) => i.message).join(', ')}`
        );
      }

      return validationResult.data;
    } catch (error: any) {
      const status = error?.status || error?.statusCode;
      const code = error?.code || error?.error?.code;
      const message = error?.message || error?.error?.message || 'Unknown Groq LLM error';

      console.error('[GroqLLM Error Diagnostics]:');
      console.error(`  - Name: ${error?.name}`);
      console.error(`  - HTTP Status: ${status || 'N/A'}`);
      console.error(`  - Error Code: ${code || 'N/A'}`);
      console.error(`  - Message: ${message}`);

      let userMsg = message;
      if (status === 401 || code === 'invalid_api_key') {
        userMsg = 'Groq authentication failed (HTTP 401 Unauthorized). Please check your GROQ_API_KEY.';
      } else if (status === 429 || code === 'rate_limit_exceeded') {
        userMsg = 'Groq API rate limit reached (HTTP 429). Please wait a few seconds and try again.';
      }

      throw new Error(`Meeting summarization failed: ${userMsg}`);
    }
  }
}
