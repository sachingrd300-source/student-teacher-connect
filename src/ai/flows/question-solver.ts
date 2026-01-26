
'use server';
/**
 * @fileOverview An AI-powered question solver for students.
 *
 * - solveQuestion - A function that takes a student's question and returns an answer.
 * - QuestionSolverInput - The input type for the solveQuestion function.
 * - QuestionSolverOutput - The return type for the solveQuestion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

const QuestionSolverInputSchema = z.object({
  question: z.string().describe('The question asked by the student.'),
});
export type QuestionSolverInput = z.infer<typeof QuestionSolverInputSchema>;

const QuestionSolverOutputSchema = z.object({
  answer: z.string().describe('A detailed, step-by-step answer to the student\'s question in HTML format. Use headings (<h4>), paragraphs (<p>), lists (<ul><li>), and bold tags (<b>) for clarity. For math problems, show the steps clearly.'),
});
export type QuestionSolverOutput = z.infer<typeof QuestionSolverOutputSchema>;

export async function solveQuestion(input: QuestionSolverInput): Promise<QuestionSolverOutput> {
  return questionSolverFlow(input);
}

const prompt = ai.definePrompt({
  name: 'questionSolverPrompt',
  model: googleAI.model('gemini-1.5-pro'),
  input: {schema: QuestionSolverInputSchema},
  output: {schema: QuestionSolverOutputSchema},
  prompt: `You are an expert tutor for students. Your task is to answer the following question in a clear, step-by-step manner.

Question: "{{question}}"

Provide a detailed answer. If it's a problem, solve it step-by-step. If it's a concept, explain it with examples.
The answer should be formatted in HTML for easy reading. Use headings, paragraphs, and lists where appropriate.
`,
});

const questionSolverFlow = ai.defineFlow(
  {
    name: 'questionSolverFlow',
    inputSchema: QuestionSolverInputSchema,
    outputSchema: QuestionSolverOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
        throw new Error('The AI returned an empty or invalid response.');
    }
    return output;
  }
);
