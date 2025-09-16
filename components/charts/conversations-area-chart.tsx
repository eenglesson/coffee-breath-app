'use client';

import * as React from 'react';
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

import { useConversationChartData } from '@/lib/hooks/use-chart-data';

export const description = 'AI conversations and messages over time';

const chartConfig = {
  conversations: {
    label: 'Created Conversations',
    color: 'var(--chart-1)',
  },
  messages: {
    label: 'Messages',
    color: 'var(--chart-2)',
  },
} satisfies ChartConfig;

export function ChartAreaInteractive() {
  const [timeRange, setTimeRange] = React.useState('30d');
  const { data: chartData, isLoading, error } = useConversationChartData();

  const filteredData = React.useMemo(() => {
    const days = timeRange === '90d' ? 90 : timeRange === '30d' ? 30 : 7;
    const startIndex = Math.max(chartData.length - days, 0);
    return chartData.slice(startIndex);
  }, [chartData, timeRange]);

  const rangeLabel =
    timeRange === '90d'
      ? '3 months'
      : timeRange === '30d'
      ? '30 days'
      : '7 days';

  return (
    <Card className='pt-0 shadow-none'>
      <CardHeader className='flex items-center gap-2 space-y-0 py-5 sm:flex-row'>
        <div className='grid flex-1 gap-1'>
          <CardTitle className='font-medium'>
            Coffee Breath AI Interactions
          </CardTitle>
          <CardDescription>
            Conversations and messages for the last {rangeLabel}
          </CardDescription>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger
            className='hidden w-[160px] rounded-lg sm:ml-auto sm:flex'
            aria-label='Select a value'
          >
            <SelectValue placeholder='Last 3 months' />
          </SelectTrigger>
          <SelectContent className='rounded-xl '>
            <SelectItem value='90d' className='rounded-lg'>
              Last 3 months
            </SelectItem>
            <SelectItem value='30d' className='rounded-lg'>
              Last 30 days
            </SelectItem>
            <SelectItem value='7d' className='rounded-lg '>
              Last 7 days
            </SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className='px-2 pt-4 sm:px-4 sm:pt-4'>
        {error ? (
          <div className='flex h-[250px] w-full items-center justify-center text-sm text-red-500'>
            Failed to load chart data
          </div>
        ) : isLoading ? (
          <div className='flex h-[250px] w-full items-center justify-center gap-2 text-sm text-muted-foreground'>
            <Loader2 className='size-4 animate-spin' />
            Loading activity...
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className='aspect-auto h-[250px] w-full'
          >
            <AreaChart data={filteredData}>
              <defs>
                <linearGradient
                  id='fillConversations'
                  x1='0'
                  y1='0'
                  x2='0'
                  y2='1'
                >
                  <stop
                    offset='5%'
                    stopColor='var(--color-conversations)'
                    stopOpacity={0.8}
                  />
                  <stop
                    offset='95%'
                    stopColor='var(--color-conversations)'
                    stopOpacity={0.1}
                  />
                </linearGradient>
                <linearGradient id='fillMessages' x1='0' y1='0' x2='0' y2='1'>
                  <stop
                    offset='5%'
                    stopColor='var(--color-messages)'
                    stopOpacity={0.8}
                  />
                  <stop
                    offset='95%'
                    stopColor='var(--color-messages)'
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey='date'
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  });
                }}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => {
                      return new Date(value).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      });
                    }}
                    indicator='dot'
                  />
                }
              />
              <Area
                dataKey='messages'
                type='monotone'
                fill='url(#fillMessages)'
                stroke='var(--color-messages)'
              />
              <Area
                dataKey='conversations'
                type='monotone'
                fill='url(#fillConversations)'
                stroke='var(--color-conversations)'
              />
              <ChartLegend content={<ChartLegendContent />} />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
