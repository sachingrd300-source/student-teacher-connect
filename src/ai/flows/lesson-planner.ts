'use server';
/**
 * @fileOverview An AI-powered assistant for generating lesson plans for teachers.
 *
 * - generateLessonPlan - A function that takes a topic and other details and creates a lesson plan.
 * - LessonPlannerInput - The input type for the function.
 * - LessonPlannerOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

const LessonPlannerInputSchema = z.object({
  topic: z.string().describe('The main topic for the lesson (e.g., "The Solar System", "Pythagorean Theorem").'),
  subject: z.string().describe('The subject the topic belongs to (e.g., "Science", "Mathematics").'),
  classLevel: z.string().describe('The grade or class level for the lesson (e.g., "Class 8").'),
  duration: z.number().min(5).describe('The total duration of the lesson in minutes.'),
});
export type LessonPlannerInput = z.infer<typeof LessonPlannerInputSchema>;

const LessonPlannerOutputSchema = z.object({
  learningObjectives: z.array(z.string()).describe('A list of 3-4 clear learning objectives for the lesson.'),
  materialsNeeded: z.array(z.string()).describe('A list of materials, resources, or technology needed for the lesson.'),
  lessonActivities: z.string().describe('A detailed, step-by-step plan of activities for the lesson, formatted in HTML. This should include sections for Introduction, Main Activity, and a Conclusion/Assessment.'),
});
export type LessonPlannerOutput = z.infer<typeof LessonPlannerOutputSchema>;

export async function generateLessonPlan(input: LessonPlannerInput): Promise<LessonPlannerOutput> {
  return lessonPlannerFlow(input);
}

const prompt = ai.definePrompt({
  name: 'lessonPlannerPrompt',
  model: googleAI.model('gemini-1.5-pro'),
  input: {schema: LessonPlannerInputSchema},
  output: {schema: LessonPlannerOutputSchema},
  prompt: `You are an expert curriculum designer for teachers in India. Your task is to create a structured and engaging lesson plan.

Lesson Details:
- Topic: "{{topic}}"
- Subject: "{{subject}}"
- Class Level: {{classLevel}}
- Duration: {{duration}} minutes

Generate a lesson plan with the following components:

1.  **Learning Objectives:** Create a list of 3-4 specific and measurable goals that students should achieve by the end of the lesson.
2.  **Materials Needed:** List all necessary materials, like "Whiteboard", "Markers", "Chart paper", "Textbook", etc.
3.  **Lesson Activities:** Provide a step-by-step breakdown of the lesson formatted as a single HTML string. Use <h4> for headings and <ul>/<li> for lists where appropriate. Structure the activities into three parts:
    *   **Introduction (approx. 20% of time):** An engaging hook to capture student interest.
    *   **Main Activity (approx. 60% of time):** The core part of the lesson where you explain the concept, perhaps with a group activity.
    *   **Conclusion & Assessment (approx. 20% of time):** A wrap-up activity to summarize the learning and a quick way to check for understanding (e.g., a few simple questions or an exit ticket).

Make the content and activities appropriate for the specified class level and topic.
`,
});

const lessonPlannerFlow = ai.defineFlow(
  {
    name: 'lessonPlannerFlow',
    inputSchema: LessonPlannerInputSchema,
    outputSchema: LessonPlannerOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
        throw new Error('The AI returned an empty or invalid response.');
    }
    return output;
  }
);
