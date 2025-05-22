import { supabaseServerService } from '@/lib/supabaseServerService';
import ContainerStudents from './ContainerStudents';

export default async function page() {
  const students = await supabaseServerService.getStudents();

  return (
    <div>
      <ContainerStudents initialStudents={students} />
    </div>
  );
}
