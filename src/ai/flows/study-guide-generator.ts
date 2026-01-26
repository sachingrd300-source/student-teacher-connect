'use server';
/**
 * @fileOverview An AI-powered assistant for generating study guides for students.
 *
 * - generateStudyGuide - A function that takes a topic and subject and creates a study guide.
 * - StudyGuideInput - The input type for the function.
 * - StudyGuideOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

const StudyGuideInputSchema = z.object({
  topic: z.string().describe('The topic or chapter for the study guide (e.g., "Cell Structure", "Indian Rebellion of 1857").'),
  subject: z.string().describe('The subject the topic belongs to (e.g., "Biology", "History").'),
});
export type StudyGuideInput = z.infer<typeof StudyGuideInputSchema>;

const StudyGuideOutputSchema = z.object({
  guide: z.string().describe('A comprehensive study guide formatted in HTML. It should include a summary, key concepts in a list, and a few practice questions.'),
});
export type StudyGuideOutput = z.infer<typeof StudyGuideOutputSchema>;

export async function generateStudyGuide(input: StudyGuideInput): Promise<StudyGuideOutput> {
  return studyGuideGeneratorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'studyGuideGeneratorPrompt',
  model: googleAI.model('gemini-1.5-pro'),
  input: {schema: StudyGuideInputSchema},
  output: {schema: StudyGuideOutputSchema},
  prompt: `You are an expert tutor creating a study guide for a student.
The topic is "{{topic}}" in the subject "{{subject}}".

Your task is to generate a concise and helpful study guide in HTML format.

The guide must include the following sections, using appropriate HTML tags like <h4> for headings, <p> for paragraphs, and <ul>/<li> for lists:

1.  **Summary:** A brief overview of the topic (1-2 paragraphs).
2.  **Key Concepts:** A bulleted list explaining the most important terms, definitions, and ideas.
3.  **Practice Questions:** A short list of 3-5 questions (short answer or conceptual) to help the student test their understanding. Do not provide the answers to these questions.

Format the entire output as a single HTML string.
`,
});

const studyGuideGeneratorFlow = ai.defineFlow(
  {
    name: 'studyGuideGeneratorFlow',
    inputSchema: StudyGuideInputSchema,
    outputSchema: StudyGuideOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
        throw new Error('The AI returned an empty or invalid response.');
    }
    return output;
  }
);
