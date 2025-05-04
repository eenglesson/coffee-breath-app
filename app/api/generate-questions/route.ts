import { NextRequest, NextResponse } from 'next/server';
import { ChatOpenAI } from '@langchain/openai';
import { createClient } from '@/lib/supabase/server';
import { Tables } from '@/database.types';

export async function POST(req: NextRequest) {
  const { prompt, students } = await req.json();

  if (!prompt || !Array.isArray(students) || students.length === 0) {
    return NextResponse.json(
      { error: 'Invalid input: prompt and students array are required' },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  const grok = new ChatOpenAI({
    apiKey: process.env.XAI_API_KEY!,
    model: 'grok-3-mini',
    configuration: { baseURL: 'https://api.x.ai/v1' },
  });

  // Classify the intent of the prompt
  const intent = classifyIntent(prompt);

  if (intent === 'generate_questions') {
    return generateQuestions(prompt, students, supabase, grok);
  } else if (intent === 'create_lesson_plan') {
    return generateLessonPlan(prompt, students, supabase, grok);
  } else {
    return NextResponse.json(
      {
        error:
          'Could not determine the intent of the prompt. Please include keywords like "question", "lesson plan", etc.',
      },
      { status: 400 }
    );
  }
}

// Classify the teacher's prompt into an intent
function classifyIntent(prompt: string): string {
  const lowerPrompt = prompt.toLowerCase();
  if (
    lowerPrompt.includes('question') ||
    lowerPrompt.includes('quiz') ||
    lowerPrompt.includes('problem')
  ) {
    return 'generate_questions';
  } else if (
    lowerPrompt.includes('lesson plan') ||
    lowerPrompt.includes('teaching plan')
  ) {
    return 'create_lesson_plan';
  } else {
    return 'unknown';
  }
}

// Generate personalized questions for students
async function generateQuestions(
  prompt: string,
  students: Tables<'students'>[],
  supabase: any,
  grok: ChatOpenAI
) {
  const results: { studentId: string; questions: string[] }[] = [];

  for (const { id } of students) {
    const { data: student, error } = await supabase
      .from('students')
      .select('interests, learning_difficulties')
      .eq('id', id)
      .single();

    if (error || !student) continue;

    const personalised = `Generate engaging questions based on "${prompt}" tailored to a student with interests in ${student.interests} and learning difficulties in ${student.learning_difficulties}. Return a list of questions, one per line, with no extra text.`;

    const { generations } = await grok.generate([
      [{ role: 'user', content: personalised }],
    ]);

    const responseText = generations[0][0].text;
    const questions = responseText
      .split('\n')
      .map((q) => q.trim())
      .filter((q) => q.length > 0);

    await supabase.from('learning_questions').insert(
      questions.map((question) => ({
        student_id: id,
        question,
        created_at: new Date().toISOString(),
      }))
    );

    results.push({ studentId: id, questions });
  }

  return NextResponse.json({
    message: 'Questions generated',
    answer: results,
  });
}

// Generate a lesson plan based on the prompt
async function generateLessonPlan(
  prompt: string,
  students: Tables<'students'>[],
  supabase: any,
  grok: ChatOpenAI
) {
  const allDifficulties = students
    .map((s) => s.learning_difficulties)
    .join(', ');

  const lessonPlanPrompt = `
    Create a concise, step-by-step lesson plan for the topic "${prompt}" that guides the teacher on what to do during the lesson. The plan should:
    
    - Be a practical guideline for a diverse class of 30 students in a classroom.
    - Include specific strategies for learning difficulties like ${allDifficulties}.
    - Use analogies tied to students interests (e.g., sports, technology) that connect directly to the topic.
    - Be adaptable, with tips for adjusting based on student needs.
    
    Structure the plan in Markdown format as a numbered list, where each step includes:
    Do good spacing in bwetween the steps.
    - **When**: The timing (e.g., "First 5 minutes", "Next 15 minutes").
    - **What to do**: Clear actions for the teacher, with differentiation options.
    
    Generate the plan in English unless "in Swedish" is specified in the prompt. Focus only on what the teacher does at each stage—no extra sections like goals or reflection.`;

  const { generations } = await grok.generate([
    [{ role: 'user', content: lessonPlanPrompt }],
  ]);

  const lessonPlanMarkdown = generations[0][0].text;

  return NextResponse.json({
    message: 'Lesson plan generated',
    lessonPlan: lessonPlanMarkdown,
  });
}

// const classificationPrompt = `
// Determine what the following prompt is asking for:
// - If it asks to create questions, quizzes, or problems for students, respond with "generate_questions".
// - If it asks to create a lesson plan or teaching plan, respond with "create_lesson_plan".
// - If it's unclear or doesn't match the above, respond with "unknown".

// Examples:
// - "Generate math questions about fractions" -> "generate_questions"
// - "Create a lesson plan for teaching photosynthesis" -> "create_lesson_plan"

// Prompt: "${prompt}"

// Response:
// `;

// const { generations } = await grok.generate([
// [{ role: 'user', content: classificationPrompt }],
// ]);

// const intent = generations[0][0].text.trim().toLowerCase();
// console.log(`Classified intent: ${intent}`); // Debugging log to check AI response

// // Flexible intent matching
// if (intent.includes('questions')) {
// return 'generate_questions';
// } else if (intent.includes('lesson plan')) {
// return 'create_lesson_plan';
// } else {
// return 'unknown';
// }
// }
