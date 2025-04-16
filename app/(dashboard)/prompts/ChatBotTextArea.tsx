'use client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowUp } from 'lucide-react';
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

  return (
    <div className='p-4 max-w-2xl'>
      <div className='relative'>
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className='w-full p-4 pr-14 border rounded-xl resize-none min-h-32 max-h-64 overflow-y-auto hide-scrollbar'
          placeholder='Type your message here...'
          aria-label='Message input'
        />
        <Button
          type='button'
          size={'icon'}
          onClick={handleSubmit}
          className={`
            group absolute bottom-2 text-lg rounded-full right-2
            ${
              message.trim()
                ? 'bg-primary hover:scale-110 transition-transform duration-150'
                : 'bg-muted-foreground hover:bg-muted-foreground'
            }
          
          `}
          aria-label='Send message'
        >
          <ArrowUp className='text-white size-5' />
        </Button>
      </div>
    </div>
  );
}
