// app/ChatBotTextArea.tsx
'use client';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ArrowUp } from 'lucide-react';
import React, { useState, useRef } from 'react';
import ClassStudentSelector from './ClassStudentSelector';
import { ButtonFileUpload } from '@/components/common/button-file-upload';
import { FileList } from '@/components/common/file-list';
import { ButtonSearch } from '@/components/common/button-search';

interface ChatBotTextAreaProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (
    e: React.FormEvent,
    options?: {
      body?: {
        selectedStudents: {
          id: string;
          interests: string | null;
          learning_difficulties: string | null;
          school_year: string | null;
        }[];
        uploadedFiles?: File[];
        searchEnabled?: boolean;
      };
    }
  ) => void;
  isUserAuthenticated?: boolean;
  model?: string;
}

export default function ChatBotTextArea({
  value,
  onChange,
  onSubmit,
  isUserAuthenticated = true,
  model = 'default',
}: ChatBotTextAreaProps) {
  const [selectedStudents, setSelectedStudents] = useState<
    {
      id: string;
      interests: string | null;
      learning_difficulties: string | null;
      school_year: string | null;
    }[]
  >([]);

  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [searchEnabled, setSearchEnabled] = useState<boolean>(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleFileUpload = (files: File[]) => {
    setUploadedFiles((prev) => {
      const newFiles = [...prev, ...files];
      // Limit to 5 files maximum
      return newFiles.slice(0, 5);
    });
  };

  const handleFileRemove = (fileToRemove: File) => {
    setUploadedFiles((prev) => prev.filter((file) => file !== fileToRemove));
  };

  const handleSearchToggle = (isSelected: boolean) => {
    setSearchEnabled(isSelected);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() || uploadedFiles.length > 0) {
      try {
        onSubmit(e, {
          body: {
            selectedStudents,
            uploadedFiles,
            searchEnabled,
          },
        });

        // Clear files after successful submission
        setUploadedFiles([]);

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
      handleSubmit(e);
    }
  };

  return (
    <div className='flex w-full flex-col'>
      <TooltipProvider>
        <div className='relative border rounded-3xl overflow-hidden bg-background dark:bg-sidebar shadow-sm w-full'>
          <div className='relative'>
            <FileList files={uploadedFiles} onFileRemove={handleFileRemove} />
            <Textarea
              ref={textareaRef}
              value={value}
              onChange={onChange}
              onKeyDown={handleKeyDown}
              className='w-full p-4 border-none resize-none h-24 shadow-none overflow-y-auto hide-scrollbar focus:ring-0 focus-visible:ring-0 dark:bg-transparent bg-transparent'
              placeholder='Ask Coffee Breath anything...'
              aria-label='Message input'
              style={{ whiteSpace: 'pre-wrap' }}
            />
          </div>

          <div className='flex justify-between items-center p-2'>
            <div className='flex items-center gap-2'>
              <ButtonFileUpload
                onFileUpload={handleFileUpload}
                isUserAuthenticated={isUserAuthenticated}
                model={model}
              />
              <ClassStudentSelector setSelectedStudents={setSelectedStudents} />
              <ButtonSearch
                isSelected={searchEnabled}
                onToggle={handleSearchToggle}
                isAuthenticated={isUserAuthenticated}
              />
            </div>

            <Button
              type='button'
              size='icon'
              onClick={handleSubmit}
              className={`
                group rounded-full transition-all duration-150
                ${
                  value.trim() || uploadedFiles.length > 0
                    ? 'bg-primary hover:bg-primary/90 active:scale-95 hover:scale-105 shadow-md'
                    : 'dark:bg-muted-foreground/10 bg-muted-foreground/20 hover:bg-muted-foreground/30 cursor-not-allowed'
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
