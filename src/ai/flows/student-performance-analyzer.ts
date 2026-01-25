
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { googleAI } from '@genkit-ai/google-genai';

const PerformanceAnalyzerInputSchema = z.object({
  studentName: z.string().describe("The student's name."),
  className: z.string().describe("The name of the class."),
  attendance: z.object({
    present: z.number().describe('Number of days the student was present.'),
    total: z.number().describe('Total number of class days with attendance taken.'),
  }),
  testResults: z.array(
    z.object({
      testTitle: z.string().describe('The title of the test.'),
      marksObtained: z.number().describe('Marks the student obtained.'),
      totalMarks: z.number().describe('Total marks for the test.'),
    })
  ).describe("An array of the student's test results."),
});
export type PerformanceAnalyzerInput = z.infer<typeof PerformanceAnalyzerInputSchema>;


const PerformanceAnalyzerOutputSchema = z.object({
  analysis: z.string().describe('A concise, insightful analysis of the student\'s performance in HTML format. Use headings (<h4>), paragraphs (<p>), and lists (<ul><li>) for clear formatting.'),
});
export type PerformanceAnalyzerOutput = z.infer<typeof PerformanceAnalyzerOutputSchema>;

const prompt = ai.definePrompt({
  name: 'studentPerformancePrompt',
  model: googleAI.model('gemini-1.5-pro'),
  input: { schema: PerformanceAnalyzerInputSchema },
  output: { schema: PerformanceAnalyzerOutputSchema },
  prompt: `You are an expert educational assistant. Your task is to analyze a student's performance data and provide a concise, insightful summary for their teacher.

The data for student "{{studentName}}" in class "{{className}}" is as follows:
- Attendance: Attended {{attendance.present}} out of {{attendance.total}} lectures.
- Test Results:
  {{#each testResults}}
  - Test: "{{testTitle}}", Score: {{marksObtained}}/{{totalMarks}}
  {{/each}}
  {{#if (eq testResults.length 0)}}
  No test results available.
  {{/if}}

Based on this data, provide a performance analysis.

The analysis should be in HTML format and include:
1.  A heading "Overall Summary".
2.  A paragraph giving a general overview of the student's performance, considering both attendance and test scores.
3.  A heading "Strengths".
4.  An unordered list of one or two key strengths (e.g., "Consistent attendance", "Strong performance in specific topics").
5.  A heading "Areas for Improvement".
6.  An unordered list of one or two potential areas for improvement (e.g., "Slightly inconsistent attendance", "Difficulty in certain tests").
7.  A heading "Recommendation".
8.  A paragraph with a brief, actionable recommendation for the teacher.

Be positive and constructive. Focus on the data provided. If data is sparse (e.g., no tests), acknowledge that.
`,
});


const analyzePerformanceFlow = ai.defineFlow(
  {
    name: 'analyzePerformanceFlow',
    inputSchema: PerformanceAnalyzerInputSchema,
    outputSchema: PerformanceAnalyzerOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('The AI returned an empty or invalid response.');
    }
    return output;
  }
);


export async function analyzeStudentPerformance(input: PerformanceAnalyzerInput): Promise<PerformanceAnalyzerOutput> {
  return analyzePerformanceFlow(input);
}
