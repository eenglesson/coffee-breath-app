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
  student?: {
    id: string;
    interests: string | null;
    learning_difficulties: string | null;
  };
};

export default function ChatContainer() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isAiResponding, setIsAiResponding] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (
    text: string,
    selectedStudents: {
      id: string;
      interests: string | null;
      learning_difficulties: string | null;
    }[]
  ) => {
    if (isAiResponding) return;

    setIsAiResponding(true);

    // Create messages
    let newMessages: Message[];
    let aiMessages: Message[];

    if (selectedStudents.length === 0) {
      const userMessageId = uuidv4();
      newMessages = [
        {
          id: userMessageId,
          type: 'user',
          content: text,
          isComplete: true,
        },
      ];
      aiMessages = [
        {
          id: uuidv4(),
          type: 'assistant',
          content: '',
          userMessageId,
          isComplete: false,
        },
      ];
    } else {
      newMessages = selectedStudents.map((student) => ({
        id: uuidv4(),
        type: 'user',
        content: text,
        isComplete: true,
        student,
      }));
      aiMessages = newMessages.map((userMessage) => ({
        id: uuidv4(),
        type: 'assistant',
        content: '',
        userMessageId: userMessage.id,
        isComplete: false,
      }));
    }

    setMessages((prev) => [...prev, ...newMessages, ...aiMessages]);

    try {
      const response = await fetch('/api/conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: text,
          context: messages,
          students: selectedStudents,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      if (selectedStudents.length === 0) {
        let parsedResponse;
        try {
          parsedResponse = JSON.parse(data.response);
          const assistantContent =
            parsedResponse.content || 'No content available';
          setMessages((prev) =>
            prev.map((msg) =>
              msg.type === 'assistant' && !msg.isComplete
                ? { ...msg, content: assistantContent, isComplete: true }
                : msg
            )
          );
        } catch (error) {
          console.error('Failed to parse assistant response:', error);
          throw new Error('Invalid response format');
        }
      } else {
        const assistantResponses: { studentId: string; response: string }[] =
          data.responses || [];
        setMessages((prev) =>
          prev.map((msg) => {
            if (msg.type === 'assistant' && !msg.isComplete) {
              const response = assistantResponses.find(
                (r) =>
                  r.studentId ===
                  newMessages.find((m) => m.id === msg.userMessageId)?.student
                    ?.id
              );
              if (response) {
                let parsedResponse;
                try {
                  parsedResponse = JSON.parse(response.response);
                  const assistantContent =
                    parsedResponse.content || 'No content available';
                  return {
                    ...msg,
                    content: assistantContent,
                    isComplete: true,
                  };
                } catch (error) {
                  console.error('Failed to parse assistant response:', error);
                  return {
                    ...msg,
                    content: 'Error: Invalid response format',
                    isComplete: true,
                  };
                }
              }
            }
            return msg;
          })
        );
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.type === 'assistant' && !msg.isComplete
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
      const students = userMessage.student ? [userMessage.student] : [];
      sendMessage(userMessage.content, students);
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
