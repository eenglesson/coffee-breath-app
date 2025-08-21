import { Loader } from '@/components/prompt-kit/loader';
import { ModeToggle } from '@/components/ui/toggle-dark-light-mode';

export default function page() {
  return (
    <div>
      dashboard
      <ModeToggle />
      <Loader />
    </div>
  );
}
