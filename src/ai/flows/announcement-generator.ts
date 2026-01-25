'use server';
/**
 * @fileOverview An AI-powered assistant for generating class announcements.
 *
 * - generateAnnouncement - A function that takes key points and generates a full announcement.
 * - AnnouncementGeneratorInput - The input type for the function.
 * - AnnouncementGeneratorOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

const AnnouncementGeneratorInputSchema = z.object({
  keyPoints: z.string().describe('A few bullet points or a short phrase about the announcement (e.g., "Test on Friday about Chapter 5", "No class tomorrow due to rain").'),
  tone: z.enum(['Formal', 'Casual']).describe('The desired tone for the announcement.'),
});
export type AnnouncementGeneratorInput = z.infer<typeof AnnouncementGeneratorInputSchema>;

const AnnouncementGeneratorOutputSchema = z.object({
  content: z.string().describe('The fully drafted announcement content, ready to be sent to students.'),
});
export type AnnouncementGeneratorOutput = z.infer<typeof AnnouncementGeneratorOutputSchema>;

export async function generateAnnouncement(input: AnnouncementGeneratorInput): Promise<AnnouncementGeneratorOutput> {
  return announcementGeneratorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'announcementGeneratorPrompt',
  model: googleAI.model('gemini-1.5-pro'),
  input: {schema: AnnouncementGeneratorInputSchema},
  output: {schema: AnnouncementGeneratorOutputSchema},
  prompt: `You are an assistant for a teacher. Your task is to write a clear and concise announcement for students based on the provided key points.

Key Points: "{{keyPoints}}"
Tone: {{tone}}

Draft a suitable announcement. If the points mention a date like "tomorrow" or "Friday", keep it relative. Address the students warmly (e.g., "Hello students," or "Hi everyone,").
`,
});

const announcementGeneratorFlow = ai.defineFlow(
  {
    name: 'announcementGeneratorFlow',
    inputSchema: AnnouncementGeneratorInputSchema,
    outputSchema: AnnouncementGeneratorOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
        throw new Error('The AI returned an empty or invalid response.');
    }
    return output;
  }
);
