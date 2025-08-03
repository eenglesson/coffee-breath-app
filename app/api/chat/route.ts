// app/api/chat/route.ts
import { streamText } from 'ai';
import { xai } from '@ai-sdk/xai';
import { addMessageToConversation } from '@/app/actions/messages/messages';

export async function POST(req: Request) {
  const { messages, selectedStudents, conversationId } = await req.json();

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
your name is Coffee Breath, and you are a helpful AI assistant that specializes in adapting educational content for students based on their individual needs and interests.
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

  const model = xai('grok-3-mini-latest');

  const result = streamText({
    model,
    messages,
    system: studentContext,
    maxTokens: 8192,
    temperature: 0.7,
    topP: 1,
    onFinish: async ({ text }) => {
      // Save messages to conversation if conversationId is provided
      if (conversationId && messages.length > 0) {
        try {
          // Get the last user message (the most recent one in this request)
          const lastUserMessage = messages[messages.length - 1];
          if (lastUserMessage?.role === 'user') {
            // Always save both the user message and AI response
            // The frontend will handle not sending duplicate first messages
            await addMessageToConversation(
              conversationId,
              lastUserMessage.content,
              'user'
            );

            await addMessageToConversation(conversationId, text, 'assistant');
          }
        } catch (error) {
          console.error('Failed to save messages to conversation:', error);
        }
      }
    },
  });

  return result.toDataStreamResponse();
}
