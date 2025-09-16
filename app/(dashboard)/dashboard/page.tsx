import ChatHistoryCard from './dashboard/chat-history-card';
import GraphInfo from './dashboard/chart-dashboard-info';
import LessonPlanHistoryCard from './dashboard/lesson-plan-history-card';
import { getProfileWithSchool } from '@/app/actions/profiles/server';

export default async function DashboardPage() {
  const { profile } = await getProfileWithSchool();

  return (
    <div className='p-4'>
      <header className='mb-4'>
        <h1 className='text-2xl font-bold'>
          Welcome back, {profile.full_name}
        </h1>
        <p className='text-sm text-muted-foreground'>
          Here&apos;s a quick overview of your activity.
        </p>
      </header>
      <GraphInfo />
      <div className='flex flex-wrap gap-4 [&>*]:flex-[1_1_370px]'>
        <ChatHistoryCard />
        <LessonPlanHistoryCard />
        <LessonPlanHistoryCard />
      </div>
    </div>
  );
}
