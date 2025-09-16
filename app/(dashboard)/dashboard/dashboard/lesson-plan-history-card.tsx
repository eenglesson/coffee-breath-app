import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { CardTitle } from '@/components/ui/card';
import React from 'react';

function LessonPlanHistoryCard() {
  return (
    <Card className='shadow-none border-none bg-accent/70 [&_>*]:p-2 p-2 gap-0'>
      <CardHeader className='flex justify-between'>
        <CardTitle className='text-xl font-medium'>
          Lesson Plan History
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-2'>
        <div className='text-sm text-muted-foreground'>
          No lesson plans yet. Create a new lesson plan to get started.
        </div>
      </CardContent>
    </Card>
  );
}

export default LessonPlanHistoryCard;
