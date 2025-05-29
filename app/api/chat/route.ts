import { streamText } from 'ai';
import { xai } from '@ai-sdk/xai';
import { chatbotPrompt } from '@/lib/prompts/chatbot';

export async function POST(req: Request) {
  // Extract messages and selectedStudents from the request body
  const { messages, selectedStudents } = await req.json();

  // Generate context from selectedStudents
  let studentContext = '';
  if (selectedStudents?.length > 0) {
    studentContext =
      'The following student information should be considered when generating responses:\n';
    selectedStudents.forEach(
      (student: {
        id: string;
        interests: string | null;
        learning_difficulties: string | null;
        school_year: string | null;
      }) => {
        studentContext += `- Student ID: ${student.id}\n`;
        studentContext += `  School Year: ${
          student.school_year || 'Not specified'
        }\n`;
        studentContext += `  Interests: ${
          student.interests || 'None provided'
        }\n`;
        studentContext += `  Learning Difficulties: ${
          student.learning_difficulties || 'None provided'
        }\n`;
      }
    );
    studentContext +=
      'Use this information to tailor responses, such as creating questions or explanations that align with the students’ interests, accommodate their learning difficulties, and are appropriate for their school year.\n';
  }

  // Combine chatbotPrompt with studentContext
  const systemPrompt = studentContext
    ? `${chatbotPrompt}\n\n${studentContext}`
    : chatbotPrompt;

  // Get a language model
  const model = xai('grok-3-mini-latest');

  // Call the language model with the prompt
  const result = streamText({
    model,
    messages,
    system: systemPrompt,
    maxTokens: 8192,
    temperature: 0.7,
    topP: 1,
  });

  // Respond with a streaming response
  return result.toDataStreamResponse();
}
