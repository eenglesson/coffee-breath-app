"use client";

import * as React from "react";

import { useConversations } from "@/lib/context/ConversationsContext";

export type ConversationChartPoint = {
  date: string;
  conversations: number;
  messages: number;
};

const TOTAL_DAYS = 90;

const startOfDay = (value: Date) => {
  const normalized = new Date(value);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

const formatDateKey = (value: Date) => startOfDay(value).toISOString().slice(0, 10);

export function useConversationChartData() {
  const { conversations, isLoading, error } = useConversations();

  const data = React.useMemo<ConversationChartPoint[]>(() => {
    const endDate = startOfDay(new Date());
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - (TOTAL_DAYS - 1));

    // Ensure we always have an entry for each day in range so the chart never collapses.
    const base: ConversationChartPoint[] = [];
    const dataMap = new Map<string, ConversationChartPoint>();

    for (let dayIndex = 0; dayIndex < TOTAL_DAYS; dayIndex += 1) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + dayIndex);
      const dateKey = formatDateKey(date);
      const point: ConversationChartPoint = {
        date: dateKey,
        conversations: 0,
        messages: 0,
      };
      base.push(point);
      dataMap.set(dateKey, point);
    }

    const isWithinRange = (input: Date) => input >= startDate && input <= endDate;

    conversations.forEach((conversation) => {
      if (conversation.created_at) {
        const createdAt = startOfDay(new Date(conversation.created_at));
        if (isWithinRange(createdAt)) {
          const bucket = dataMap.get(formatDateKey(createdAt));
          if (bucket) {
            bucket.conversations += 1;
          }
        }
      }

      const messages = Array.isArray(conversation.messages)
        ? conversation.messages
        : [];

      messages.forEach((message) => {
        if (!message?.created_at) return;
        const messageDate = startOfDay(new Date(message.created_at));
        if (!isWithinRange(messageDate)) return;
        const bucket = dataMap.get(formatDateKey(messageDate));
        if (bucket) {
          bucket.messages += 1;
        }
      });
    });

    return base;
  }, [conversations]);

  return { data, isLoading, error };
}
