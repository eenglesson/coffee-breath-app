'use client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ArrowUp, LayoutList } from 'lucide-react';
import React, { useState, useRef } from 'react';

import ClassStudentSelector from './ClassStudentSelector';

interface ChatBotTextAreaProps {
  onSendMessage: (
    text: string,
    selectedStudents: {
      id: string;
      interests: string | null;
      learning_difficulties: string | null;
    }[]
  ) => void | Promise<void>;
  isAiResponding: boolean;
}

export default function ChatBotTextArea({
  onSendMessage,
  isAiResponding,
}: ChatBotTextAreaProps) {
  const [input, setInput] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<
    {
      id: string;
      interests: string | null;
      learning_difficulties: string | null;
    }[]
  >([]);
  console.log('Selected students:', selectedStudents);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async () => {
    if (input.trim()) {
      try {
        await onSendMessage(input, selectedStudents);
        setInput('');
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      } catch (error) {
        console.error('Error sending message:', error);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className='flex w-full'>
      <TooltipProvider>
        <div className='relative border rounded-xl overflow-hidden bg-background dark:bg-muted shadow-sm w-full'>
          <div className='relative'>
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className='w-full p-4 border-none resize-none h-24 shadow-none overflow-y-auto hide-scrollbar focus:ring-0 focus-visible:ring-0 dark:bg-transparent bg-transparent'
              placeholder='Type your text here...'
              aria-label='Message input'
              style={{ whiteSpace: 'pre-wrap' }}
            />
          </div>

          <div className='flex justify-between items-center p-2'>
            <div className='flex items-center gap-2'>
              <Button
                type='button'
                size='icon'
                variant='outline'
                className='text-muted-foreground rounded-full'
                aria-label='Layout list'
              >
                <LayoutList />
              </Button>
              <ClassStudentSelector setSelectedStudents={setSelectedStudents} />
            </div>
            <Button
              type='button'
              size='icon'
              onClick={handleSubmit}
              disabled={isAiResponding}
              className={`
                group rounded-full
                ${
                  input.trim()
                    ? 'bg-primary active:scale-110 hover:scale-110 transition-transform duration-150'
                    : 'dark:bg-muted-foreground/10 bg-muted-foreground hover:bg-muted-foreground'
                }
              `}
              aria-label='Send message'
            >
              <ArrowUp className='text-white size-5' />
            </Button>
          </div>
        </div>
      </TooltipProvider>
    </div>
  );
}
