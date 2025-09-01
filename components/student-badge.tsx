import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { cva } from 'class-variance-authority';
import {
  Rocket,
  Lightbulb,
  Search,
  Users,
  HelpCircle,
  Trophy,
  Image,
  Calculator,
  BookOpen,
  Monitor,
} from 'lucide-react';

const studentBadgeVariants = cva(
  'border-transparent cursor-default [&>svg]:size-4 [&>svg]:h-4 [&>svg]:w-4 [&>svg>path]:stroke-[2.5]',
  {
    variants: {
      type: {
        'initiative-taker': 'bg-[#FDF2F8] text-[#DB2777]',
        'imaginative-mind': 'bg-[#ECFEFF] text-[#0891B2]',
        'detail-detective': 'bg-[#EFEBE9] text-[#6D4C41]',
        'question-star': 'bg-[#E0F2F1] text-[#00796B]',
        'group-energizer': 'bg-[#FCF4DB] text-[#E6961F]',
        'effort-champion': 'bg-[#EFEAFF] text-[#6D3CFA]',
        'image-savvy': 'bg-[#E5F3FE] text-[#008DFF]',
        'math-whiz': 'bg-[#E1FAE8] text-[#37C25C]',
        'story-teller': 'bg-[#F1F1F1] text-[#787878]',
        'tech-explorer': 'bg-[#FDEFEE] text-[#EC6A5B]',
      },
    },
    defaultVariants: {
      type: 'initiative-taker',
    },
  }
);

export interface StudentBadgeType {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

export const STUDENT_BADGE_TYPES: StudentBadgeType[] = [
  {
    id: 'initiative-taker',
    name: 'Initiative Taker',
    icon: Rocket,
    description: 'Proactively starts tasks or seeks challenges',
  },
  {
    id: 'imaginative-mind',
    name: 'Imaginative Mind',
    icon: Lightbulb,
    description: 'Generates unique ideas for projects',
  },
  {
    id: 'detail-detective',
    name: 'Detail Detective',
    icon: Search,
    description: 'Notices details, excels in precision tasks',
  },
  {
    id: 'group-energizer',
    name: 'Group Energizer',
    icon: Users,
    description: 'Boosts group morale and collaboration',
  },
  {
    id: 'question-star',
    name: 'Question Star',
    icon: HelpCircle,
    description: 'Poses thoughtful questions',
  },
  {
    id: 'effort-champion',
    name: 'Effort Champion',
    icon: Trophy,
    description: 'Consistently puts in strong effort',
  },
  {
    id: 'image-savvy',
    name: 'Image Savvy',
    icon: Image,
    description: 'Engages with visual content',
  },
  {
    id: 'math-whiz',
    name: 'Math Whiz',
    icon: Calculator,
    description: 'Shows exceptional mathematical ability',
  },
  {
    id: 'story-teller',
    name: 'Story Teller',
    icon: BookOpen,
    description: 'Excels at narrative and creative writing',
  },
  {
    id: 'tech-explorer',
    name: 'Tech Explorer',
    icon: Monitor,
    description: 'Curious about technology and coding',
  },
];

// Define the available badge types for TypeScript autocomplete
export type StudentBadgeTypeIds =
  | 'initiative-taker'
  | 'imaginative-mind'
  | 'detail-detective'
  | 'group-energizer'
  | 'question-star'
  | 'effort-champion'
  | 'image-savvy'
  | 'math-whiz'
  | 'story-teller'
  | 'tech-explorer';

interface StudentBadgeProps {
  type?: StudentBadgeTypeIds;
  className?: string;
}

// Helper function to extract background color from class string
function extractBackgroundColor(classString: string): string {
  const bgMatch = classString.match(/bg-\[([^\]]+)\]/);
  return bgMatch ? bgMatch[1] : '';
}

export default function StudentBadge({ type, className }: StudentBadgeProps) {
  // If a specific type is provided, use that badge type
  const badgeType = type
    ? STUDENT_BADGE_TYPES.find((b) => b.id === type)
    : null;

  if (badgeType) {
    const IconComponent = badgeType.icon;

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant='default'
            className={cn(
              studentBadgeVariants({
                type: badgeType.id as StudentBadgeTypeIds,
              }),
              className
            )}
          >
            <IconComponent />
            <span className={cn('text-sm font-medium', className)}>
              {badgeType.name}
            </span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent
          side='bottom'
          className={cn(
            'border-transparent px-3 py-2 text-xs font-medium',
            studentBadgeVariants({
              type: badgeType.id as StudentBadgeTypeIds,
            })
          )}
          arrowColor={extractBackgroundColor(
            studentBadgeVariants({
              type: badgeType.id as StudentBadgeTypeIds,
            })
          )}
        >
          <p className='text-xs font-medium'>{badgeType.description}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  // Fallback to the original behavior if no type is specified
}
