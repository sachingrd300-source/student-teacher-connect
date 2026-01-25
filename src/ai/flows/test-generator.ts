'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { googleAI } from '@genkit-ai/google-genai';

const GenerateTestInputSchema = z.object({
    topic: z.string().describe('The main topic or chapter for the test'),
    subject: z.string().describe('The subject of the test (e.g., Physics, History)'),
    classLevel: z.string().describe('The grade or class level for the test (e.g., "Class 10")'),
    numQuestions: z.number().min(1).max(20).describe('The number of questions to generate'),
    difficulty: z.enum(['Easy', 'Medium', 'Hard']).describe('The difficulty level of the questions'),
});
export type GenerateTestInput = z.infer<typeof GenerateTestInputSchema>;

const QuestionSchema = z.object({
    questionText: z.string().describe('The full text of the question'),
    options: z.array(z.string()).length(4).describe('An array of 4 possible answers'),
    correctAnswer: z.string().describe('The correct answer from the options array'),
});
export type Question = z.infer<typeof QuestionSchema>;

const GenerateTestOutputSchema = z.object({
    questions: z.array(QuestionSchema),
});
export type GenerateTestOutput = z.infer<typeof GenerateTestOutputSchema>;


const prompt = ai.definePrompt({
    name: 'testGeneratorPrompt',
    model: googleAI.model('gemini-pro'),
    input: { schema: GenerateTestInputSchema },
    output: { schema: GenerateTestOutputSchema },
    prompt: `You are an expert educator tasked with creating a multiple-choice test.

    Generate a test with {{numQuestions}} questions based on the following criteria:
    - Subject: {{subject}}
    - Topic: {{topic}}
    - Class Level: {{classLevel}}
    - Difficulty: {{difficulty}}
    
    Each question must have exactly 4 options.
    Ensure the questions are relevant to the topic and appropriate for the specified class level and difficulty.
    Provide the correct answer for each question.
    Format the output as a valid JSON object matching the provided schema.`,
});

const generateTestQuestionsFlow = ai.defineFlow(
    {
        name: 'generateTestQuestionsFlow',
        inputSchema: GenerateTestInputSchema,
        outputSchema: GenerateTestOutputSchema,
    },
    async (input) => {
        const { output } = await prompt(input);
        if (!output) {
            throw new Error('Failed to generate test questions.');
        }
        return output;
    }
);

export async function generateTest(input: GenerateTestInput): Promise<GenerateTestOutput> {
    return generateTestQuestionsFlow(input);
}
