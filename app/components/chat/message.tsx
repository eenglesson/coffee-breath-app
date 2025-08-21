import { UIMessage as MessageType } from '@ai-sdk/react';
import React, { useState } from 'react';
import { MessageAssistant } from './message-assistant';
import { MessageUser } from './message-user';

type MessageProps = {
  variant: MessageType['role'];
  children: string;
  id: string;
  // attachments?: MessageType['experimental_attachments'];
  isLast?: boolean;
  onEdit: (id: string, newText: string) => void;
  onReload: () => void;
  hasScrollAnchor?: boolean;
  parts?: MessageType['parts'];
  status?: 'streaming' | 'ready' | 'submitted' | 'error';
  className?: string;
  onQuote?: (text: string, messageId: string) => void;
  metadata?: MessageType['metadata'];
};

export function Message({
  variant,
  children,
  id,
  // attachments,
  isLast,
  onEdit,
  onReload,
  hasScrollAnchor,
  parts,
  status,
  className,
  onQuote,
  metadata,
}: MessageProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 500);
  };

  if (variant === 'user') {
    return (
      <MessageUser
        copied={copied}
        copyToClipboard={copyToClipboard}
        onReload={onReload}
        onEdit={onEdit}
        id={id}
        hasScrollAnchor={hasScrollAnchor}
        // attachments={attachments}
        className={className}
      >
        {children}
      </MessageUser>
    );
  }

  if (variant === 'assistant') {
    return (
      <MessageAssistant
        copied={copied}
        copyToClipboard={copyToClipboard}
        onReload={onReload}
        isLast={isLast}
        hasScrollAnchor={hasScrollAnchor}
        parts={parts}
        status={status}
        className={className}
        messageId={id}
        onQuote={onQuote}
        metadata={metadata}
      >
        {children}
      </MessageAssistant>
    );
  }

  return null;
}
