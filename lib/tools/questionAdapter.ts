// lib/tools/questionAdapter.ts
import { z } from 'zod';
import { tool } from 'ai';

const adaptedQuestionSchema = z.object({
  original: z.string().describe('The original question'),
  adapted: z.string().describe('The adapted question for the specific student'),
  explanation: z
    .string()
    .describe('Explanation of why this adaptation was made'),
  subject: z.string().optional().describe('Subject area (e.g., Math, Science)'),
  difficulty: z
    .enum(['easy', 'medium', 'hard'])
    .optional()
    .describe(
      'Difficulty level - assign based on student capabilities: easy/medium for students with learning difficulties, progressive ladder for others'
    ),
});

const studentWithAdaptedQuestionsSchema = z.object({
  id: z.string().describe('Student ID'),
  name: z
    .string()
    .describe('Student name (use "Student" + ID if name not provided)'),
  school_year: z.string().optional().describe('School year/grade'),
  interests: z.string().optional().describe('Student interests'),
  learning_difficulties: z
    .string()
    .optional()
    .describe('Learning difficulties'),
  adaptedQuestions: z
    .array(adaptedQuestionSchema)
    .describe('Array of adapted questions for this student'),
});

export const adaptQuestionsForStudentsTool = tool({
  description: `Adapt previously generated questions for specific students based on their individual needs, interests, and learning difficulties. 
  This tool should be used when the user asks to customize or adapt questions for selected students.
  
  The tool will:
  1. Take the original questions from the conversation
  2. Adapt each question for each student based on their profile
  3. Provide explanations for each adaptation
  4. Assign appropriate difficulty levels based on student capabilities:
     - Students WITH learning difficulties: Use "easy" or "medium" only (never "hard")
     - Students WITHOUT learning difficulties: Use appropriate mix of "easy", "medium", "hard"
     - Create a progressive ladder - don't make all questions the same difficulty
  5. Return data formatted for the AdaptedQuestionsTable component`,

  parameters: z.object({
    originalQuestions: z
      .array(z.string())
      .describe('The original questions to adapt'),
    students: z
      .array(studentWithAdaptedQuestionsSchema)
      .describe('Students with their adapted questions'),
    adaptationFocus: z
      .string()
      .describe(
        'Brief description of the adaptation focus (e.g., "Based on interests and learning needs")'
      ),
  }),

  execute: async ({ originalQuestions, students, adaptationFocus }) => {
    // The actual execution is handled by the AI model
    // This just validates and returns the structured data
    return {
      originalQuestions,
      students,
      adaptationFocus,
      success: true,
      message: `Successfully adapted ${originalQuestions.length} questions for ${students.length} students`,
    };
  },
});
