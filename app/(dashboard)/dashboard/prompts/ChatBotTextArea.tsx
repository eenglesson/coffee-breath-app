'use client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ArrowUp, LayoutList } from 'lucide-react';
import React, { useState } from 'react';
import PopoverListStudents from './PopoverListStudents';
import { Tables } from '@/database.types';

interface ChatBotTextAreaProps {
  onSendMessage?: (
    text: string,
    selectedStudents: Tables<'students'>[]
  ) => void;
  students: Tables<'students'>[];
}

export default function ChatBotTextArea({
  onSendMessage,
  students,
}: ChatBotTextAreaProps) {
  const [message, setMessage] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<
    Tables<'students'>[]
  >([]);

  const handleSubmit = () => {
    if (message.trim() && selectedStudents.length > 0) {
      onSendMessage?.(message, selectedStudents);
      setMessage('');
      // Optionally reset selectedStudents here if desired
      // setSelectedStudents([]);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text/plain');
    setMessage((prev) => prev + pastedText);
  };

  return (
    <div className='flex w-full'>
      <TooltipProvider>
        <div className='relative border rounded-xl overflow-hidden bg-background shadow-sm w-full'>
          <div className='relative'>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onPaste={handlePaste}
              className='w-full p-4 border-none resize-none min-h-32 max-h-40 shadow-none overflow-y-auto hide-scrollbar focus:ring-0 focus-visible:ring-0 bg-transparent'
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
                className='rounded-full'
                aria-label='Layout list'
              >
                <LayoutList />
              </Button>
              <PopoverListStudents
                students={students}
                onSelect={setSelectedStudents}
              />
            </div>
            <Button
              type='button'
              size='icon'
              onClick={handleSubmit}
              disabled={!message.trim() || selectedStudents.length === 0}
              className={`
                group rounded-full
                ${
                  message.trim() && selectedStudents.length > 0
                    ? 'bg-primary active:scale-110 hover:scale-110 transition-transform duration-150'
                    : 'bg-muted-foreground hover:bg-muted-foreground'
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
