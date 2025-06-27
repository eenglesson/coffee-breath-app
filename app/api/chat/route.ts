// app/api/chat/route.ts
import { streamText } from 'ai';
import { xai } from '@ai-sdk/xai';
import { chatbotPrompt } from '@/lib/prompts/chatbot';
import { adaptQuestionsForStudentsTool } from '@/lib/tools/questionAdapter';

export async function POST(req: Request) {
  const { messages, selectedStudents } = await req.json();

  let studentContext = '';
  if (selectedStudents?.length > 0) {
    studentContext =
      'The following student information should be considered when generating responses:\n';
    selectedStudents.forEach(
      (student: {
        id: string;
        name?: string;
        interests: string | null;
        learning_difficulties: string | null;
        school_year: string | null;
      }) => {
        studentContext += `- Student ID: ${student.id}\n`;
        studentContext += `  Name: ${
          student.name || 'Student ' + student.id
        }\n`;
        studentContext += `  School Year: ${
          student.school_year || 'Not specified'
        }\n`;
        studentContext += `  Interests: ${
          student.interests || 'None provided'
        }\n`;
        studentContext += `  Learning Difficulties: ${
          student.learning_difficulties || 'None provided'
        }\n\n`;
      }
    );
    studentContext += `
IMPORTANT: When the user asks to adapt, customize, or theme questions for these students, you MUST use the adaptQuestionsForStudents tool. 

The tool expects:
- originalQuestions: Array of question strings from the conversation
- students: Array of student objects with adaptedQuestions
- adaptationFocus: Brief description of the adaptation approach

For each student, create thoughtful adaptations considering their:
- Interests (incorporate themes they enjoy)
- Learning difficulties (provide appropriate accommodations)
- Grade level (adjust complexity appropriately)
- Individual learning needs

Make sure each adaptation includes:
- original: The original question text
- adapted: The modified question for this specific student
- explanation: Clear reasoning for why this adaptation helps this student
- subject: Subject area if applicable
- difficulty: Appropriate difficulty level

Use this information to tailor responses, such as creating questions or explanations that align with the students' interests, accommodate their learning difficulties, and are appropriate for their school year.\n`;
  }

  const systemPrompt = studentContext
    ? `${chatbotPrompt}\n\n${studentContext}`
    : chatbotPrompt;

  const model = xai('grok-3-mini-latest');

  const result = streamText({
    model,
    messages,
    system: systemPrompt,

    tools: {
      adaptQuestionsForStudents: adaptQuestionsForStudentsTool,
    },

    maxTokens: 8192,
    temperature: 0.7,
    topP: 1,
  });

  return result.toDataStreamResponse();
}
