'use client';
import { useState, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import ChatMessages from './ChatMessages';
import ChatBotTextArea from './ChatBotTextArea';

export type Message = {
  id: string;
  type: 'user' | 'ai';
  content: string;
  userMessageId?: string;
  isComplete: boolean;
};

export default function ChatContainer() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isAiResponding, setIsAiResponding] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (text: string) => {
    if (isAiResponding) return;

    setIsAiResponding(true);

    const userMessageId = uuidv4();
    const userMessage: Message = {
      id: userMessageId,
      type: 'user',
      content: text,
      isComplete: true,
    };
    const aiMessageId = uuidv4();
    const aiMessage: Message = {
      id: aiMessageId,
      type: 'ai',
      content: '',
      userMessageId,
      isComplete: false,
    };
    setMessages((prev) => [...prev, userMessage, aiMessage]);

    const eventSource = new EventSource(
      `/api/generateQuestions?message=${encodeURIComponent(text)}`
    );
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMessageId
            ? { ...msg, content: msg.content + event.data }
            : msg
        )
      );
    };

    const handleStreamEnd = () => {
      eventSource.close();
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMessageId ? { ...msg, isComplete: true } : msg
        )
      );
      setIsAiResponding(false);
    };

    eventSource.onerror = handleStreamEnd;
    eventSource.addEventListener('end', handleStreamEnd);
  };

  const stopStreaming = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      setMessages((prev) =>
        prev.map((msg) =>
          msg.type === 'ai' && !msg.isComplete
            ? { ...msg, isComplete: true }
            : msg
        )
      );
      setIsAiResponding(false);
    }
  };

  const redoAnswer = (userMessageId: string) => {
    const userMessage = messages.find(
      (msg) => msg.id === userMessageId && msg.type === 'user'
    );
    if (userMessage) {
      sendMessage(userMessage.content);
    }
  };

  return (
    <div className='relative flex flex-col h-full max-w-4xl w-full mx-auto'>
      {messages.length === 0 ? (
        <div className='flex justify-center items-center h-full'>
          <ChatBotTextArea
            onSendMessage={sendMessage}
            isAiResponding={isAiResponding}
          />
        </div>
      ) : (
        <>
          <div className='flex-grow overflow-y-auto '>
            <ChatMessages
              messages={messages}
              onRedo={redoAnswer}
              onStop={stopStreaming}
              messagesEndRef={messagesEndRef}
            />
          </div>
          <div className='sticky bottom-4 left-0 right-0'>
            <ChatBotTextArea
              onSendMessage={sendMessage}
              isAiResponding={isAiResponding}
            />
          </div>
        </>
      )}
    </div>
  );
}
