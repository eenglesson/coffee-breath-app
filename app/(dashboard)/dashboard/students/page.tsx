import { getStudents } from '@/app/actions/students/server';
import ContainerStudents from './ContainerStudents';

export default async function page() {
  const students = await getStudents();

  return (
    <div className='p-4'>
      <ContainerStudents initialStudents={students} />
    </div>
  );
}
