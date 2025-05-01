// app/api/generate-questions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ChatOpenAI } from '@langchain/openai';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const { prompt, students } = await req.json();
  if (!prompt || !Array.isArray(students) || students.length === 0) {
    return NextResponse.json({ error: 'Bad payload' }, { status: 400 });
  }

  const supabase = await createClient();

  const grok = new ChatOpenAI({
    apiKey: process.env.XAI_API_KEY!,
    model: 'grok-3-mini',
    configuration: { baseURL: 'https://api.x.ai/v1' },
  });

  /** Will hold all results we send back to the client */
  const results: { studentId: string; question: string }[] = [];

  for (const { id } of students) {
    const { data: s, error } = await supabase
      .from('students')
      .select('interests, learning_difficulties')
      .eq('id', id)
      .single();

    if (error || !s) continue; // skip if lookup failed

    const personalised = `Generate a concise math question based on "${prompt}" that incorporates the student's interests in ${s.interests} and accounts for their ${s.learning_difficulties}. Your response should consist solely of the math question/questions, without any introductory text, explanations, or additional context.`;

    const { generations } = await grok.generate([
      [{ role: 'user', content: personalised }],
    ]);

    const question = generations[0][0].text;

    // store in DB (optional)
    await supabase.from('learning_questions').insert({
      student_id: id,
      question,
      created_at: new Date().toISOString(),
    });

    // collect for the response
    results.push({ studentId: id, question });
  }

  return NextResponse.json({
    message: 'Asnwer generated',
    answer: results, // <-- here they are
  });
}
