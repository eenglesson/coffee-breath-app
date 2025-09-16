'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CirclePlus, Clock, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { useConversations } from '@/lib/context/ConversationsContext';
import { ConversationWithPreview } from '@/lib/types/chat';

// Helper function to format time ago
function getTimeAgo(dateString: string | null): string {
  if (!dateString) return 'Unknown';

  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInMinutes < 1) return ' Just now';
  if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
  if (diffInHours < 24) return `${diffInHours} hours ago`;
  if (diffInDays < 7) return `${diffInDays} days ago`;
  if (diffInDays < 30) return `${diffInDays} weeks ago`;
  if (diffInDays < 365) return `${diffInDays} months ago`;
  return `${diffInDays}y ago`;

  return date.toLocaleDateString();
}

export default function ChatHistoryCard() {
  const router = useRouter();
  const { conversations, isLoading, error } = useConversations();

  // Get the first 4 conversations
  const latestConversations = conversations.slice(0, 6);

  const handleConversationClick = (conversationId: string) => {
    router.push(`/dashboard/ai-chat/${conversationId}`);
  };

  return (
    <Card className='shadow-none border-none bg-accent/70 [&_>*]:p-2 p-2 gap-0'>
      <CardHeader className='flex justify-between'>
        <div className='-space-y-0.5 w-full'>
          <div className='flex items-center justify-between w-full'>
            <CardTitle className='text-xl font-medium'> Chat History</CardTitle>
            <Button
              className='text-sm font-medium gap-2 py-1 h-fit'
              onClick={() => router.push('/dashboard/ai-chat')}
            >
              <CirclePlus className='size-4' />
              New Chat
            </Button>
          </div>
          <CardDescription className='text-xs'>
            Latest conversations with Coffee Breath
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className='space-y-2'>
        {isLoading ? (
          <div className='text-center text-sm text-muted-foreground py-4 flex items-center gap-2 justify-center'>
            <Loader2 className='size-4 animate-spin' />
            Loading conversations...
          </div>
        ) : error ? (
          <div className='text-center text-sm text-red-500 py-4'>
            Failed to load conversations
          </div>
        ) : latestConversations.length === 0 ? (
          <div className='text-center text-sm text-muted-foreground py-4'>
            No conversations yet. Start a new chat!
          </div>
        ) : (
          latestConversations.map((conversation: ConversationWithPreview) => (
            <div
              key={conversation.id}
              className='bg-background rounded-xl p-2.5 flex flex-col gap-1 cursor-default hover:bg-muted-foreground/5 transition-colors'
              onClick={() => handleConversationClick(conversation.id)}
            >
              <div className='flex items-center gap-2'>
                <h1 className='truncate text-sm font-medium'>
                  {conversation.title}
                </h1>
                <Badge variant='outline' className='py-0 px-1 '>
                  {conversation.message_count} msg
                  {conversation.message_count !== 1 ? 's' : ''}
                </Badge>
              </div>
              <div className='line-clamp-2 text-sm text-muted-foreground w-full flex-1'>
                {conversation.last_message?.content || 'No messages yet'}
              </div>
              <div className='text-xs text-muted-foreground flex items-center gap-1'>
                <Clock className='size-3.5' />
                {getTimeAgo(conversation.updated_at || conversation.created_at)}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
