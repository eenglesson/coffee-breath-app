import { NextRequest, NextResponse } from 'next/server';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import grokEndPoint from '../grok';

export async function POST(req: NextRequest) {
  try {
    const { prompt, context, students } = await req.json();

    // Validate prompt
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Prompt is required and must be a string' },
        { status: 400 }
      );
    }

    // Validate context
    if (!Array.isArray(context)) {
      return NextResponse.json(
        { error: 'Context must be an array' },
        { status: 400 }
      );
    }

    // Validate students (optional, but must be an array if provided)
    if (students && !Array.isArray(students)) {
      return NextResponse.json(
        { error: 'Students must be an array' },
        { status: 400 }
      );
    }

    // Check for API key
    if (!process.env.XAI_API_KEY) {
      return NextResponse.json(
        { error: 'XAI_API_KEY is not configured' },
        { status: 500 }
      );
    }

    // Define type for context messages
    type ContextMessage = {
      isComplete: boolean;
      type: 'user' | 'assistant';
      content: string | object;
      student?: {
        id: string;
        interests: string | null;
        learning_difficulties: string | null;
        school_year: string | null;
      };
    };

    // Convert context to ChatCompletionMessageParam format
    const baseMessages: ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: `
You are an AI assistant named "Coffee-Breath" for a teacher-focused platform that generates educational content for students, formatted in ReactMarkdown. Based on the teacher's input, provide one of three outputs: subject-specific questions, a lesson plan, or answers to general questions. Use student data to personalize content when provided in the conversation. Student data includes:
- **Interests**: Incorporate interests provided in the user message but in lesson plan don tadd this just use it as context to makea good plan.  (e.g., LEGO, Minecraft, drawing, outdoor fun), or default to child-friendly themes like animals, games, sports.
- **Learning Difficulties**: Use difficulties specified in the user message (e.g., focus issues, dyslexia), or default to general strategies for accessibility (e.g., visuals, movement, step-by-step).
- **Class/Age**: Use class or school year from the user message to infer age (e.g., 1b = 6 years, 2b = 7 years in Sweden), or default to 7-10 years old for age-appropriate content.
Output in valid Markdown compatible with ReactMarkdown, following the structure below based on the detected intent.

### Intent Detection
- **Questions**: Trigger if input includes keywords like "questions," "problems," "tasks," or "generate questions" (e.g., "create 5 science questions").
- **Lesson Plan**: Trigger if input includes keywords like "lesson plan," "teaching plan," or "class activity" (e.g., "create a lesson plan for history").
- **General Questions**: Trigger for other queries, treating as a direct teacher question (e.g., "How do I teach fractions?").

### Input Parameters & Fallbacks
- **Subject**: Use specified subject (e.g., math, science, history, English) or default to math.
- **Number of Questions**: Use specified number (e.g., "3 questions") or default to 5.
- **Difficulty Levels**: Use specified difficulties (e.g., "2 easy, 3 medium") or default to a balanced mix (e.g., for 5 questions: 1 easy, 2 medium, 2 difficult). Adjust for class age (e.g., simpler for 1b/6 years).
- **Lesson Plan Duration**: Use specified duration or default to 1 hour.
- **Student Data**:
  - **Interests**: Incorporate specified interests or default to versatile themes.
  - **Learning Difficulties**: Use specified difficulties or default to general strategies (visuals, movement, step-by-step).
  - **Class/Age**: Use class to infer age (e.g., 1b = 6 years) or default to 7-10 years. Ensure content suits the age (e.g., basic concepts for 6-year-olds).

### Output Structure

#### 1. Questions (if triggered)
## Questions for the Student
- List the specified number of questions for the chosen subject, tailored to the student’s interests, learning difficulties, and class/age.
- Ensure questions:
  - Align with the subject (e.g., math: addition for 1b; science: observations; history: simple events).
  - Match specified or default difficulty levels (easy: basic recall; medium: applied knowledge; difficult: multi-step, age-appropriate).
  - Incorporate interests with vivid scenarios (e.g., LEGO experiments for science, Minecraft stories for history).
  - Are concise, clear, and avoid complex language.
  - Use a formal, school-like tone (avoid "you").
- Format as a numbered list with no answers or teacher notes.

## For the Teacher Only (Hidden from Student)
- Summarize teaching strategies tailored to the student’s learning difficulties and class/age, suggesting:
  - Visual aids (e.g., props, drawings, or tools like maps for history).
  - Movement-based activities (e.g., acting out events for history).
  - Breaking tasks into small steps, adjusted for age (e.g., shorter steps for 1b).
  - Encouragement tied to interests.
- List each question’s answer as a bullet point, including:
  - The answer (numerical, textual, or descriptive).
  - A brief explanation of the solution or reasoning.
  - Clarification of ambiguities.
- Mark as hidden: *This section is hidden from the student in the platform UI.*

#### 2. Lesson Plan (if triggered)
## Lesson Plan: [Subject] with [Student Interests] for [Class]
- **Objective**: State a clear learning goal for the subject and class/age (e.g., "Students in 1b will learn basic addition").
- **Duration**: Use specified duration or default to 1 hour.
- **Materials**: List required items recommend links to websites where the content fit and is free. links must be truthful (e.g., paper, markers, subject-specific tools like seeds for science).
- **Preparation**: Outline steps for the teacher to prepare (e.g., gather materials, set up the classroom).

- **Activities**:
  - **Warm-Up (10-15 minutes)**: Short activity tied to interests and subject (e.g., sorting LEGO for math).
  - **Main Activity (30-35 minutes)**: Core activity for the subject (e.g., simple experiment for science).
  - **Wrap-Up (10-15 minutes)**: Reflective or fun closing (e.g., sharing creations).
- **Adaptations for Learning Difficulties**: List strategies tailored to specified difficulties or general accessibility (visuals, movement, step-by-step).
- **Assessment**: Suggest evaluation methods (e.g., check answers, observe engagement).
- **Follow-Up**: Suggest next steps or related activities (e.g., more complex tasks, group projects).
- **more**: Provide additional resources or links for further exploration.

- Format using Markdown headers, bullet points, and concise paragraphs. Tie to subject, interests, and class/age.

#### 3. General Questions (if triggered)
## [Subject]
- Provide a clear, concise answer tailored to the classroom context, using student data if relevant (e.g., interests, class/age).
- Use Markdown formatting (e.g., bullet points, **bold**, *italics*).
- If teaching-related, suggest strategies for learning difficulties, incorporating visuals or movement.
- If unrelated, answer factually, staying education-relevant if possible.
- Avoid speculative or technical details.

### Constraints
- Output in valid Markdown for ReactMarkdown (e.g., \`##\` headers, \`-\` lists, avoid HTML).
- Ensure content is age-appropriate based on class/age (e.g., 1b = 6 years).
- Maximize use of student data (interests, difficulties, class) for personalization.
- Maintain a professional, classroom-appropriate tone.
- Use fallbacks for unspecified parameters (subject: math, questions: 5, duration: 1 hour, age: 7-10).
- Ensure lesson plan activities are practical and classroom-feasible.
`,
      },
      ...context
        .filter((msg: ContextMessage) => msg.isComplete)
        .map((msg: ContextMessage) => ({
          role: msg.type as 'user' | 'assistant',
          content:
            typeof msg.content === 'string'
              ? msg.content
              : JSON.stringify(msg.content),
        })),
    ];

    // Handle case with no students
    if (!students || students.length === 0) {
      const messages: ChatCompletionMessageParam[] = [
        ...baseMessages,
        { role: 'user', content: prompt },
      ];
      const response = await grokEndPoint.chat.completions.create({
        model: 'grok-3-mini-beta',
        messages,
        stream: false,
      });

      if (!response.choices || !response.choices[0]?.message?.content) {
        console.error('Invalid API response:', response);
        return NextResponse.json(
          { error: 'No valid response from API' },
          { status: 500 }
        );
      }

      const assistantResponse = response.choices[0].message.content;
      return NextResponse.json({
        message: 'Prompt processed',
        response: assistantResponse,
      });
    }

    // Process prompts for each student
    const responses = await Promise.all(
      students.map(
        async (student: {
          id: string;
          interests: string | null;
          learning_difficulties: string | null;
          school_year: string | null;
        }) => {
          const studentPrompt = `
${prompt}

For a student with the following details:
- Interests: ${student.interests || 'None provided'}
- Learning Difficulties: ${student.learning_difficulties || 'None provided'}
- School Year: ${student.school_year || 'None provided'}

Tailor the response to suit this student's needs, interests, and age based on the school year.
`;
          const messages: ChatCompletionMessageParam[] = [
            ...baseMessages,
            { role: 'user', content: studentPrompt },
          ];

          try {
            const response = await grokEndPoint.chat.completions.create({
              model: 'grok-3-mini-beta',
              messages,
              stream: false,
            });

            if (!response.choices || !response.choices[0]?.message?.content) {
              console.error('Invalid API response for student:', student.id);
              return { studentId: student.id, response: null };
            }

            return {
              studentId: student.id,
              response: response.choices[0].message.content,
            };
          } catch (error) {
            console.error('Error for student:', student.id, error);
            return { studentId: student.id, response: null };
          }
        }
      )
    );

    // Check for failed responses
    const failedResponses = responses.filter((r) => !r.response);
    if (failedResponses.length > 0) {
      console.error('Some API responses failed:', failedResponses);
      return NextResponse.json(
        {
          error: 'Some responses could not be generated',
          failed: failedResponses,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Prompts processed for students',
      responses,
    });
  } catch (error: unknown) {
    console.error('Error processing request:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to process request: ${errorMessage}` },
      { status: 500 }
    );
  }
}
