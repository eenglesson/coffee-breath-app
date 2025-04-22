'use client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ArrowUp, LayoutList } from 'lucide-react';
import React, { useState } from 'react';

interface ChatBotTextAreaProps {
  onSendMessage: (text: string) => void;
}

export default function ChatBotTextArea({
  onSendMessage,
}: ChatBotTextAreaProps) {
  const [message, setMessage] = useState('');

  const handleSubmit = () => {
    if (message.trim()) {
      onSendMessage(message);
      console.log('Message sent:', message);
      setMessage('');
    }
  };

  // Handle paste event to preserve formatting
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault(); // Prevent default paste behavior
    const pastedText = e.clipboardData.getData('text/plain'); // Get plain text from clipboard
    setMessage((prev) => prev + pastedText); // Append pasted text to current message
  };

  return (
    <div className='max-w-3xl flex w-full'>
      <TooltipProvider>
        <div className='relative border rounded-xl overflow-hidden bg-background shadow-sm w-full'>
          <div className='relative'>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onPaste={handlePaste} // Add paste event handler
              className='w-full p-4  border-none resize-none min-h-32 max-h-48 shadow-none overflow-y-auto hide-scrollbar focus:ring-0 focus-visible:ring-0 bg-transparent'
              placeholder='Type your text here...'
              aria-label='Message input'
              style={{ whiteSpace: 'pre-wrap' }} // Preserve line breaks and spacing
            />
          </div>
          <div className='flex justify-between items-center p-2 '>
            <Button
              type='button'
              size='icon'
              variant='outline'
              className='rounded-full'
              aria-label='Layout list'
            >
              <LayoutList />
            </Button>
            <Button
              type='button'
              size='icon'
              onClick={handleSubmit}
              className={`
              group rounded-full
              ${
                message.trim()
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
