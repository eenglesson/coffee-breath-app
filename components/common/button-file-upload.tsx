import {
  FileUpload,
  FileUploadContent,
  FileUploadTrigger,
} from '@/components/prompt-kit/file-upload';
import { Button } from '@/components/ui/button';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { cn } from '@/lib/utils';
import { Paperclip, Upload } from 'lucide-react';

import React from 'react';

type ButtonFileUploadProps = {
  onFileUpload: (files: File[]) => void;
  isUserAuthenticated: boolean;
  model: string;
};

export function ButtonFileUpload({
  onFileUpload,
  isUserAuthenticated,
}: ButtonFileUploadProps) {
  // if (!isSupabaseEnabled) {
  //   return null;
  // }

  // const isFileUploadAvailable = MODELS.find((m) => m.id === model)?.vision;

  // if (!isFileUploadAvailable) {
  //   return (
  //     <Popover>
  //       <Tooltip>
  //         <TooltipTrigger asChild>
  //           <PopoverTrigger asChild>
  //             <Button
  //               size='sm'
  //               variant='secondary'
  //               className='border-border dark:bg-secondary size-9 rounded-full border bg-transparent'
  //               type='button'
  //               aria-label='Add files'
  //             >
  //               <Paperclip className='size-4' />
  //             </Button>
  //           </PopoverTrigger>
  //         </TooltipTrigger>
  //         <TooltipContent>Add files</TooltipContent>
  //       </Tooltip>
  //       <PopoverContent className='p-2'>
  //         <div className='text-secondary-foreground text-sm'>
  //           This model does not support file uploads.
  //           <br />
  //           Please select another model.
  //         </div>
  //       </PopoverContent>
  //     </Popover>
  //   );
  // }

  // if (!isUserAuthenticated) {
  //   return (
  //     <Popover>
  //       <Tooltip>
  //         <TooltipTrigger asChild>
  //           <PopoverTrigger asChild>
  //             <Button
  //               size='sm'
  //               variant='secondary'
  //               className='border-border dark:bg-secondary size-9 rounded-full border bg-transparent'
  //               type='button'
  //               aria-label='Add files'
  //             >
  //               <Paperclip className='size-4' />
  //             </Button>
  //           </PopoverTrigger>
  //         </TooltipTrigger>
  //         <TooltipContent>Add files</TooltipContent>
  //       </Tooltip>
  //       {/* <PopoverContentAuth /> */}
  //     </Popover>
  //   );
  // }

  return (
    <FileUpload
      onFilesAdded={onFileUpload}
      multiple
      disabled={!isUserAuthenticated}
      accept='.txt,.md,.doc,.docx,.pdf,.pages,text/plain,text/markdown,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/rtf,application/vnd.oasis.opendocument.text,image/jpeg,image/png,image/gif,image/webp,image/svg,image/heic,image/heif'
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <FileUploadTrigger asChild>
            <Button
              size='sm'
              variant='outline'
              className={cn(
                'border-border dark:bg-secondary text-muted-foreground size-9 rounded-full border bg-transparent',
                !isUserAuthenticated && 'opacity-50'
              )}
              type='button'
              disabled={!isUserAuthenticated}
              aria-label='Add files'
            >
              <Paperclip className='size-4' />
            </Button>
          </FileUploadTrigger>
        </TooltipTrigger>
        <TooltipContent>Add files (documents, PDFs, images)</TooltipContent>
      </Tooltip>
      <FileUploadContent>
        <div className='border-input bg-background flex flex-col items-center rounded-lg border border-dashed p-8'>
          <Upload className='text-muted-foreground size-8' />
          <span className='mt-4 mb-1 text-lg font-medium'>Drop files here</span>
          <span className='text-muted-foreground text-sm'>
            Drop documents, PDFs, or images here to add them to the conversation
          </span>
          <div className='mt-2 text-xs text-muted-foreground'>
            Supported: TXT, MD, DOC, DOCX, PDF, Images
          </div>
        </div>
      </FileUploadContent>
    </FileUpload>
  );
}
