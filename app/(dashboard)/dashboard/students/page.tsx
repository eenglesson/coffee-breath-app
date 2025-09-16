import { getStudents } from '@/app/actions/students/server';
import ContainerStudents from './ContainerStudents';

// Hybrid approach: SSR for first load, TanStack Query caching for subsequent navigations
export default async function page() {
  // Server-side fetch - provides immediate data on first visit
  const students = await getStudents();

  return (
    <div className='p-4'>
      <ContainerStudents initialStudents={students} />
    </div>
  );
}
