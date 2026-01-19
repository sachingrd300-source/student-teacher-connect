'use server';
/**
 * @fileOverview An AI flow for generating test papers for teachers.
 *
 * - generateTestPaper - A function that handles the test paper generation process.
 * - GenerateTestPaperInput - The input type for the generateTestPaper function.
 * - GenerateTestPaperOutput - The return type for the generateTestPaper function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GenerateTestPaperInputSchema = z.object({
  topic: z.string().describe('The main topic for the test paper (e.g., "Newton\'s Laws of Motion").'),
  subject: z.string().describe('The subject of the test (e.g., "Physics").'),
  classLevel: z.string().describe('The class level for which the test is intended (e.g., "Class 11").'),
  numQuestions: z.number().min(1).max(20).describe('The number of questions to generate.'),
});
export type GenerateTestPaperInput = z.infer<typeof GenerateTestPaperInputSchema>;

const QuestionSchema = z.object({
    questionText: z.string().describe('The full text of the question.'),
    questionType: z.enum(['mcq', 'short_answer']).describe('The type of the question.'),
    options: z.array(z.string()).optional().describe('An array of 4-5 strings for multiple choice questions.'),
    correctAnswer: z.string().describe('The correct answer for the question. For MCQs, this should be one of the options.'),
});

const GenerateTestPaperOutputSchema = z.object({
  questions: z.array(QuestionSchema).describe('An array of generated questions.'),
});
export type GenerateTestPaperOutput = z.infer<typeof GenerateTestPaperOutputSchema>;

export async function generateTestPaper(input: GenerateTestPaperInput): Promise<GenerateTestPaperOutput> {
  return generateTestPaperFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateTestPaperPrompt',
  input: { schema: GenerateTestPaperInputSchema },
  output: { schema: GenerateTestPaperOutputSchema },
  prompt: `You are an expert educator and test creator for the Indian education system. Your task is to generate a high-quality test paper based on the following criteria.

You must generate exactly {{{numQuestions}}} questions.
The questions should be a mix of multiple-choice questions (MCQs) and short-answer questions.
MCQs must have exactly 4 options.
Ensure the questions are relevant for the specified topic, subject, and class level.
The difficulty should be appropriate for the class level.

Topic: {{{topic}}}
Subject: {{{subject}}}
Class Level: {{{classLevel}}}

Generate the questions and provide the output in the specified JSON format.
For each question, clearly state the question text, its type ('mcq' or 'short_answer'), the options (for MCQs), and the correct answer.`,
});

const generateTestPaperFlow = ai.defineFlow(
  {
    name: 'generateTestPaperFlow',
    inputSchema: GenerateTestPaperInputSchema,
    outputSchema: GenerateTestPaperOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
