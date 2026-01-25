'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { googleAI } from '@genkit-ai/google-genai';

const GenerateTestInputSchema = z.object({
    topic: z.string().describe('The main topic or chapter for the test'),
    subject: z.string().describe('The subject of the test (e.g., Physics, History)'),
    classLevel: z.string().describe('The grade or class level for the test (e.g., "Class 10")'),
    numQuestions: z.number().min(1).describe('The number of questions to generate'),
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
    model: googleAI.model('gemini-1.5-pro'),
    input: { schema: GenerateTestInputSchema },
    // output: { schema: GenerateTestOutputSchema }, // Removed to prevent invalid "responseMimeType" param
    prompt: `You are an expert educator tasked with creating a multiple-choice test.

    Generate a test with {{numQuestions}} questions based on the following criteria:
    - Subject: {{subject}}
    - Topic: {{topic}}
    - Class Level: {{classLevel}}
    - Difficulty: {{difficulty}}
    
    Each question must have exactly 4 options.
    Ensure the questions are relevant to the topic and appropriate for the specified class level and difficulty.
    Provide the correct answer for each question.
    
    IMPORTANT: Your entire response must be ONLY a single, valid JSON object. Do not wrap it in markdown like \`\`\`json. The JSON object must conform to this structure:
    {
      "questions": [
        {
          "questionText": "The full text of the question",
          "options": ["An array of 4 possible answers"],
          "correctAnswer": "The correct answer from the options array"
        }
      ]
    }`,
});

const generateTestQuestionsFlow = ai.defineFlow(
    {
        name: 'generateTestQuestionsFlow',
        inputSchema: GenerateTestInputSchema,
        outputSchema: GenerateTestOutputSchema,
    },
    async (input) => {
        const response = await prompt(input);
        const textResponse = response.text;

        if (!textResponse) {
            throw new Error('The AI returned an empty response.');
        }

        try {
            // The prompt now asks for raw JSON, so we just parse it.
            const parsedOutput = JSON.parse(textResponse);
            // We should still validate it against our schema on the way out.
            return GenerateTestOutputSchema.parse(parsedOutput);
        } catch (e) {
            console.error("Failed to parse JSON response from AI:", textResponse, e);
            // Fallback: Try to find JSON inside markdown ```json ... ```
            const jsonMatch = textResponse.match(/```json\n([\s\S]*?)\n```/);
            if (jsonMatch && jsonMatch[1]) {
                try {
                    const parsedJson = JSON.parse(jsonMatch[1]);
                    return GenerateTestOutputSchema.parse(parsedJson);
                } catch (e2) {
                     console.error("Failed to parse JSON from markdown block:", jsonMatch[1], e2);
                }
            }
            throw new Error("The AI returned a response in an invalid format.");
        }
    }
);

export async function generateTest(input: GenerateTestInput): Promise<GenerateTestOutput> {
    return generateTestQuestionsFlow(input);
}
