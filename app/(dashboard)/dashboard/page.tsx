import StudentBadge, {
  STUDENT_BADGE_TYPES,
  StudentBadgeType,
  StudentBadgeTypeIds,
} from '@/components/student-badge';

import { ModeToggle } from '@/components/ui/toggle-dark-light-mode';

export default function page() {
  return (
    <div>
      dashboard
      <ModeToggle />
      {STUDENT_BADGE_TYPES.map((badge: StudentBadgeType) => (
        <StudentBadge key={badge.id} type={badge.id as StudentBadgeTypeIds} />
      ))}
    </div>
  );
}
