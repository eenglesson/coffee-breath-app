import type { ConversationWithPreview } from '@/lib/types/chat';

type TimeGroup = {
  name: string;
  conversations: ConversationWithPreview[];
};

// Group conversations by time periods
export function groupConversationsByDate(
  conversations: ConversationWithPreview[],
  searchQuery: string
): TimeGroup[] | null {
  if (searchQuery) return null; // Don't group when searching

  const now = new Date();
  const today = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  ).getTime();
  const weekAgo = today - 7 * 24 * 60 * 60 * 1000;
  const monthAgo = today - 30 * 24 * 60 * 60 * 1000;
  const yearStart = new Date(now.getFullYear(), 0, 1).getTime();

  const todayConversations: ConversationWithPreview[] = [];
  const last7DaysConversations: ConversationWithPreview[] = [];
  const last30DaysConversations: ConversationWithPreview[] = [];
  const thisYearConversations: ConversationWithPreview[] = [];
  const olderConversations: Record<number, ConversationWithPreview[]> = {};

  conversations.forEach((conversation) => {
    if (!conversation.updated_at) {
      todayConversations.push(conversation);
      return;
    }

    const conversationTimestamp = new Date(conversation.updated_at).getTime();

    if (conversationTimestamp >= today) {
      todayConversations.push(conversation);
    } else if (conversationTimestamp >= weekAgo) {
      last7DaysConversations.push(conversation);
    } else if (conversationTimestamp >= monthAgo) {
      last30DaysConversations.push(conversation);
    } else if (conversationTimestamp >= yearStart) {
      thisYearConversations.push(conversation);
    } else {
      const year = new Date(conversation.updated_at).getFullYear();
      if (!olderConversations[year]) {
        olderConversations[year] = [];
      }
      olderConversations[year].push(conversation);
    }
  });

  const result: TimeGroup[] = [];

  // Helper function to sort conversations by updated_at descending
  const sortByUpdatedAt = (convs: ConversationWithPreview[]) =>
    convs.sort((a, b) => {
      const dateA = new Date(a.updated_at || a.created_at || '').getTime();
      const dateB = new Date(b.updated_at || b.created_at || '').getTime();
      return dateB - dateA;
    });

  if (todayConversations.length > 0) {
    result.push({
      name: 'Today',
      conversations: sortByUpdatedAt(todayConversations),
    });
  }

  if (last7DaysConversations.length > 0) {
    result.push({
      name: 'Last 7 days',
      conversations: sortByUpdatedAt(last7DaysConversations),
    });
  }

  if (last30DaysConversations.length > 0) {
    result.push({
      name: 'Last 30 days',
      conversations: sortByUpdatedAt(last30DaysConversations),
    });
  }

  if (thisYearConversations.length > 0) {
    result.push({
      name: 'This year',
      conversations: sortByUpdatedAt(thisYearConversations),
    });
  }

  Object.entries(olderConversations)
    .sort(([yearA], [yearB]) => Number(yearB) - Number(yearA))
    .forEach(([year, yearConversations]) => {
      result.push({
        name: year,
        conversations: sortByUpdatedAt(yearConversations),
      });
    });

  return result;
}

// Format date in a human-readable way
export function formatDate(dateString?: string | null): string {
  if (!dateString) return 'No date';

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // Less than 1 hour: show minutes
  if (diffMinutes < 60) {
    if (diffMinutes < 1) return 'Just now';
    return `${diffMinutes} ${diffMinutes === 1 ? 'minute' : 'minutes'} ago`;
  }

  // Less than 24 hours: show hours
  if (diffHours < 24) {
    return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  }

  // Less than 7 days: show days
  if (diffDays < 7) {
    return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
  }

  // Same year: show month and day
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  }

  // Different year: show month, day and year
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}
