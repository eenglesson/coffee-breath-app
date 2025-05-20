// components/ChatContainer.tsx
'use client';
import { useState, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import ChatMessages from './ChatMessages';
import ChatBotTextArea from './ChatBotTextArea';

export type Message = {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  userMessageId?: string;
  isComplete: boolean;
};

export default function ChatContainer() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isAiResponding, setIsAiResponding] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text: string) => {
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
      type: 'assistant',
      content: '',
      userMessageId,
      isComplete: false,
    };
    setMessages((prev) => [...prev, userMessage, aiMessage]);

    try {
      const response = await fetch('/api/conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: text, context: messages }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch response');
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      // Parse the assistant's response
      let parsedResponse;
      try {
        parsedResponse = JSON.parse(data.response);
      } catch (error) {
        console.error('Failed to parse assistant response:', error);
        parsedResponse = { content: 'Error: Invalid response format' };
      }

      // Extract the content field
      const assistantContent = parsedResponse.content || 'No content available';

      // Update AI message with the parsed content
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMessageId
            ? { ...msg, content: assistantContent, isComplete: true }
            : msg
        )
      );
    } catch (error) {
      console.error('Error:', error);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMessageId
            ? {
                ...msg,
                content: 'Error: Failed to fetch response',
                isComplete: true,
              }
            : msg
        )
      );
    } finally {
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
          <div className='flex-grow overflow-y-auto'>
            <ChatMessages
              messages={messages}
              onRedo={redoAnswer}
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
