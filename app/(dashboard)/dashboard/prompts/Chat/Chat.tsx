'use client';
import ChatBotTextArea from './ChatBotTextArea';
import { useChat } from '@ai-sdk/react';
import { useState, useEffect, useRef } from 'react';
import ChatMessages, { Message } from './ChatMessages';

export default function Chat() {
  const [selectedStudents, setSelectedStudents] = useState<
    {
      id: string;
      interests: string | null;
      learning_difficulties: string | null;
      school_year: string | null;
    }[]
  >([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit: originalHandleSubmit,
    reload,
    setMessages,
  } = useChat({
    api: '/api/chat',
    body: { selectedStudents }, // Include selectedStudents in every API request
  });

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Only scroll when new messages are added, not on every change
  const prevMessagesLength = useRef(0);
  useEffect(() => {
    if (messages.length > prevMessagesLength.current) {
      scrollToBottom();
      prevMessagesLength.current = messages.length;
    }
  }, [messages]);

  // Custom handleSubmit to pass selectedStudents
  const handleSubmit = (
    e: React.FormEvent,
    options?: {
      body?: {
        selectedStudents: {
          id: string;
          interests: string | null;
          learning_difficulties: string | null;
          school_year: string | null;
        }[];
      };
    }
  ) => {
    if (options?.body?.selectedStudents) {
      setSelectedStudents(options.body.selectedStudents);
    }
    originalHandleSubmit(e, {
      body: { selectedStudents: options?.body?.selectedStudents || [] },
    });

    // Remove the setTimeout since useEffect will handle scrolling
  };

  // Map AI SDK messages to ChatMessages' Message type
  const formattedMessages: Message[] = messages.map((msg, index) => ({
    id: msg.id,
    type: msg.role as 'user' | 'assistant',
    content: msg.content,
    userMessageId:
      msg.role === 'assistant' && index > 0
        ? messages[index - 1]?.id
        : undefined,
    isComplete: true,
  }));

  const handleRedo = (userMessageId: string) => {
    const userMessageIndex = messages.findIndex(
      (msg) => msg.id === userMessageId && msg.role === 'user'
    );
    if (userMessageIndex === -1) return;

    const fullHistory = [...messages];
    const messagesToKeep = messages
      .slice(0, userMessageIndex + 1)
      .filter(
        (msg) =>
          msg.role !== 'assistant' || messages.indexOf(msg) < userMessageIndex
      );

    setMessages(messagesToKeep);
    reload().then(() => {
      const messagesAfterRedo = fullHistory.slice(userMessageIndex + 2);
      if (messagesAfterRedo.length > 0) {
        setMessages((prev) => [...prev, ...messagesAfterRedo]);
      }
    });
  };

  return (
    <section className='w-full max-w-4xl h-full flex flex-col'>
      {messages.length === 0 ? (
        <div className='flex flex-col items-center justify-center h-full'>
          <ChatBotTextArea
            value={input}
            onChange={handleInputChange}
            onSubmit={handleSubmit}
            isAiResponding={messages[messages.length - 1]?.role === 'assistant'}
          />
        </div>
      ) : (
        <div className='flex flex-col h-full'>
          <div ref={chatContainerRef} className='flex-1 overflow-y-auto pb-4'>
            <ChatMessages messages={formattedMessages} onRedo={handleRedo} />
            <div ref={messagesEndRef} />
          </div>
          <div className='sticky bottom-4 bg-background/80 backdrop-blur-sm pt-4'>
            <ChatBotTextArea
              value={input}
              onChange={handleInputChange}
              onSubmit={handleSubmit}
              isAiResponding={
                messages[messages.length - 1]?.role === 'assistant'
              }
            />
          </div>
        </div>
      )}
    </section>
  );
}
