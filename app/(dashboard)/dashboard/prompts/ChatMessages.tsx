import { Button } from '@/components/ui/button';
import { CardContent, CardFooter } from '@/components/ui/card';
import { Copy, RefreshCcw } from 'lucide-react';

export type Message = {
  id: string;
  type: 'user' | 'ai';
  content: string;
  userMessageId?: string;
  isComplete: boolean;
};

interface ChatMessagesProps {
  messages: Message[];
  onRedo: (userMessageId: string) => void;
  onStop: () => void;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

export default function ChatMessages({
  messages,
  onRedo,
  onStop,
  messagesEndRef,
}: ChatMessagesProps) {
  return (
    <div className='flex-1 overflow-y-auto max-w-4xl space-y-4'>
      {messages.map((msg) => (
        <Message key={msg.id} message={msg} onRedo={onRedo} onStop={onStop} />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}

function Message({
  message,
  onRedo,
  onStop,
}: {
  message: Message;
  onRedo?: (userMessageId: string) => void;
  onStop?: () => void;
}) {
  const isUser = message.type === 'user';
  const isComplete = message.isComplete;

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-center'}`}>
      <CardContent
        className={`w-full p-3  ${
          isUser
            ? 'bg-primary/95 text-white max-w-[70%] rounded-t-xl rounded-bl-xl rounded-br-xs'
            : 'border-none shadow-none'
        }`}
      >
        {isUser ? (
          <p>{message.content}</p>
        ) : (
          <div dangerouslySetInnerHTML={{ __html: message.content }} />
        )}
        {!isUser && isComplete && (
          <CardFooter className='mt-2 p-0 flex gap-1 mb-8'>
            <Button
              size='icon'
              variant='ghost'
              className='text-muted-foreground hover:primary rounded-full'
              onClick={() =>
                onRedo && message.userMessageId && onRedo(message.userMessageId)
              }
            >
              <RefreshCcw />
            </Button>
            <Button
              size='icon'
              variant='ghost'
              className='text-muted-foreground hover:primary rounded-full'
              onClick={() =>
                onRedo && message.userMessageId && onRedo(message.userMessageId)
              }
            >
              <Copy style={{ transform: 'scaleX(-1)' }} />
            </Button>
          </CardFooter>
        )}
        {!isUser && !isComplete && (
          <Button
            size='icon'
            onClick={onStop}
            className='mt-2 text-sm text-red-600 hover:underline'
          >
            Stop
          </Button>
        )}
      </CardContent>
    </div>
  );
}
