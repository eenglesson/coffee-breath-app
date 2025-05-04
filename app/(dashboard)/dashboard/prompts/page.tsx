'use client';
import { createClient } from '@/lib/supabase/client';
import ChatBotTextArea from './ChatBotTextArea';
import { useState, useEffect } from 'react';
import { Tables } from '@/database.types';
import ReactMarkdown from 'react-markdown';
import { TextShimmerWave } from '@/components/motion-primitives/text-shimmer-wave';

export default function QuestionGeneratorPage() {
  const supabase = createClient();
  const [students, setStudents] = useState<Tables<'students'>[]>([]);
  const [generatedQuestions, setGeneratedQuestions] = useState<
    { studentId: string; questions: string[] }[]
  >([]);
  const [lessonPlan, setLessonPlan] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationType, setGenerationType] = useState<string | null>(null);

  useEffect(() => {
    const fetchStudents = async () => {
      const { data, error } = await supabase.from('students').select('*');
      if (error) {
        console.error('Error fetching students:', error);
      } else {
        setStudents(data);
      }
    };
    fetchStudents();
  }, []);

  const handleSendMessage = async (
    prompt: string,
    selectedStudents: Tables<'students'>[]
  ) => {
    if (!prompt.trim() || selectedStudents.length === 0) return;

    const isQuestions = prompt.toLowerCase().includes('questions');
    const isLessonPlan = prompt.toLowerCase().includes('lesson plan');
    let type = 'content';
    if (isQuestions) type = 'questions';
    else if (isLessonPlan) type = 'lesson plan';

    setIsGenerating(true);
    setGenerationType(type);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt, students: selectedStudents }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate content');
      }

      const data = await response.json();
      if (data.error) {
        setErrorMessage(data.error);
        setGeneratedQuestions([]);
        setLessonPlan(null);
      } else if (data.message === 'Questions generated') {
        setGeneratedQuestions(data.answer);
        setLessonPlan(null);
        setErrorMessage(null);
      } else if (data.message === 'Lesson plan generated') {
        setLessonPlan(data.lessonPlan);
        setGeneratedQuestions([]);
        setErrorMessage(null);
      } else {
        setErrorMessage('Unknown response type');
      }
    } catch (error) {
      console.error('Error generating content:', error);
      setErrorMessage('An error occurred while generating content');
    } finally {
      setIsGenerating(false);
      setGenerationType(null);
    }
  };

  return (
    <div className='max-w-3xl h-full w-full mx-auto'>
      <h1 className='text-2xl font-bold mb-4'>
        AI-Powered Educational Content Generator
      </h1>
      {errorMessage && (
        <div className='mb-4 text-red-500'>
          <p>{errorMessage}</p>
        </div>
      )}
      <div className='h-fit px-4 mb-8'>
        {!isGenerating && generatedQuestions.length > 0 && (
          <div className=''>
            <h2 className='text-xl font-semibold'>Generated Questions</h2>
            {generatedQuestions.map((studentData, index) => {
              const student = students.find(
                (s) => s.id === studentData.studentId
              );
              return (
                <div key={index} className=''>
                  <p className='font-bold text-lg'>
                    Student: {student?.full_name || 'Unknown'}
                  </p>
                  {studentData.questions.map((question, qIndex) => (
                    <p key={qIndex} className='mt-2'>
                      {question}
                    </p>
                  ))}
                </div>
              );
            })}
          </div>
        )}
        {!isGenerating && lessonPlan && (
          <div className='mb-4'>
            <h2 className='text-xl font-semibold'>Generated Lesson Plan</h2>
            <div className='prose'>
              <ReactMarkdown>{lessonPlan}</ReactMarkdown>
            </div>
          </div>
        )}
      </div>

      <div className='sticky bottom-4 w-full max-w-3xl '>
        <div className='pb-1 ml-4'>
          {isGenerating && (
            <TextShimmerWave duration={1}>
              {`Generating ${generationType ? generationType : 'content'}...`}
            </TextShimmerWave>
          )}
        </div>
        <ChatBotTextArea
          onSendMessage={handleSendMessage}
          students={students}
        />
      </div>
    </div>
  );
}
