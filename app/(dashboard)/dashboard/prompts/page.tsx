'use client';

import { createClient } from '@/lib/supabase/client';
import { useState, useEffect } from 'react';
import ChatBotTextArea from './ChatBotTextArea';
import { Database } from '@/database.types';
import PopoverListStudents from './PopoverListStudents';

type Student = Database['public']['Tables']['students']['Row'];

export default function QuestionGeneratorPage() {
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentDetails, setSelectedStudentDetails] = useState<
    Pick<Student, 'id' | 'full_name' | 'learning_difficulties' | 'interests'>[]
  >([]); // New state for details
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generated, setGenerated] = useState<
    { studentId: string; question: string }[]
  >([]);

  const supabase = createClient();

  useEffect(() => {
    const fetchStudents = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase.from('students').select('*');
        if (error) throw error;
        setStudents(data || []);
      } catch (err) {
        setError('Failed to fetch students');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStudents();
  }, [supabase]);

  // Fetch details when selectedStudents change
  useEffect(() => {
    const fetchDetails = async () => {
      if (selectedStudents.length === 0) {
        setSelectedStudentDetails([]);
        return;
      }
      const { data, error } = await supabase
        .from('students')
        .select('id, full_name, learning_difficulties, interests')
        .in('id', selectedStudents);
      if (error) {
        console.error('Error fetching details:', error);
      } else {
        setSelectedStudentDetails(data || []);
      }
    };
    fetchDetails();
  }, [selectedStudents, supabase]);

  const handleSendMessage = async (prompt: string) => {
    if (selectedStudents.length === 0) {
      alert('Please select at least one student.');
      return;
    }
    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          students: selectedStudents.map((id) => ({ id })),
        }),
      });
      if (response.ok) {
        const data = await response.json();
        setGenerated(data.answer);
      } else {
        console.error('Failed to generate questions');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStudentToggle = (studentId: string) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  return (
    <div className=' max-w-3xl w-full mx-auto'>
      <h1 className='text-2xl font-bold mb-4'>
        Generate Personalized Math Questions
      </h1>

      {/* Display selected student details */}
      {selectedStudentDetails.length > 0 && (
        <div className='mb-4'>
          <h3 className='text-lg font-semibold'>Selected Student Details:</h3>
          {selectedStudentDetails.map((student) => (
            <div key={student.id} className='mt-2'>
              <p>
                <strong>Name:</strong> {student.full_name}
              </p>
              <p>
                <strong>Information</strong> {student.interests || 'None'}
              </p>
              <p>
                <strong>Learning Difficulties:</strong>{' '}
                {student.learning_difficulties || 'None'}
              </p>
            </div>
          ))}
        </div>
      )}

      <ChatBotTextArea onSendMessage={handleSendMessage} students={students} />

      {isGenerating && (
        <p className='mt-2 text-gray-500'>Generating questions...</p>
      )}
      {generated.length > 0 && (
        <div className='mt-6'>
          <h2 className='text-lg font-semibold mb-2'>Generated Questions</h2>

          {generated.map(({ studentId, question }) => {
            const student = students.find((s) => s.id === studentId);
            return (
              <div key={studentId} className='mb-3'>
                <p className='font-medium'>
                  {student?.full_name ?? 'Student'}:
                </p>
                <p className='pl-4'>{question}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
