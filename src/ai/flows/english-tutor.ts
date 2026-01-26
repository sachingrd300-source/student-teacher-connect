'use server';
/**
 * @fileOverview An AI-powered English learning assistant for Hindi-speaking students.
 *
 * - helpWithEnglish - A function that provides translation, correction, and explanation.
 * - EnglishTutorInput - The input type for the function.
 * - EnglishTutorOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

const EnglishTutorInputSchema = z.object({
  text: z.string().describe('The text input from the student. Can be in Hindi or English.'),
  mode: z.enum(['hindi-to-english', 'english-correction']).describe('The learning mode: either translating from Hindi or correcting an English sentence.'),
});
export type EnglishTutorInput = z.infer<typeof EnglishTutorInputSchema>;

const EnglishTutorOutputSchema = z.object({
  result: z.string().describe('The primary output: either the English translation or the corrected English sentence.'),
  explanation: z.string().describe('A detailed but simple explanation in a mix of English and Hindi (Hinglish) about the grammar, sentence structure, or correction. It should be easy for a Hindi medium student to understand.'),
});
export type EnglishTutorOutput = z.infer<typeof EnglishTutorOutputSchema>;

export async function helpWithEnglish(input: EnglishTutorInput): Promise<EnglishTutorOutput> {
  return englishTutorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'englishTutorPrompt',
  model: googleAI.model('gemini-1.5-pro'),
  input: {schema: EnglishTutorInputSchema},
  output: {schema: EnglishTutorOutputSchema},
  prompt: `You are an AI English teacher for a student from a Hindi medium background. Your goal is to be helpful, encouraging, and clear. Your explanations should be in simple Hinglish (a mix of Hindi and English) so it's easy to understand.

Your task depends on the mode:

1.  **Mode: 'hindi-to-english'**:
    *   The user will provide a sentence in Hindi.
    *   Translate it accurately to English and put it in the 'result' field.
    *   In the 'explanation' field, provide a simple breakdown of the English sentence structure or grammar. Explain why certain words were used. For example, explain the verb tense or prepositions.

2.  **Mode: 'english-correction'**:
    *   The user will provide a sentence in English that may have grammatical errors.
    *   Correct the sentence and put the corrected version in the 'result' field.
    *   In the 'explanation' field, clearly point out the mistake and explain the rule in simple Hinglish. For example, if it's a subject-verb agreement error, explain why the verb needs to change.

---
User Input Text: "{{text}}"
Mode: {{mode}}
---
`,
});

const englishTutorFlow = ai.defineFlow(
  {
    name: 'englishTutorFlow',
    inputSchema: EnglishTutorInputSchema,
    outputSchema: EnglishTutorOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
        throw new Error('The AI returned an empty or invalid response.');
    }
    return output;
  }
);
