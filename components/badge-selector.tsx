'use client';
import { useState } from 'react';

import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import StudentBadge, {
  STUDENT_BADGE_TYPES,
  StudentBadgeTypeIds,
} from '@/components/student-badge';
import { cn } from '@/lib/utils';
import { Plus, X } from 'lucide-react';

interface BadgeSelectorProps {
  selectedBadges: string[];
  onBadgeChange: (badges: string[]) => void;
  className?: string;
}

export default function BadgeSelector({
  selectedBadges,
  onBadgeChange,
  className,
}: BadgeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleBadgeToggle = (badgeId: string) => {
    if (selectedBadges.includes(badgeId)) {
      onBadgeChange(selectedBadges.filter((id) => id !== badgeId));
    } else {
      onBadgeChange([...selectedBadges, badgeId]);
    }
  };

  const handleRemoveBadge = (badgeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onBadgeChange(selectedBadges.filter((id) => id !== badgeId));
  };

  return (
    <div className={cn('space-y-1', className)}>
      <div className=''>
        <Label className='text-sm font-medium'>Student Badges (optional)</Label>
      </div>

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <div className='h-[40px] w-full rounded-lg border-1 border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors cursor-pointer bg-muted/20 hover:bg-muted/30 relative group'>
            {selectedBadges.length > 0 ? (
              <div className='absolute inset-0'>
                <div className='h-full overflow-x-auto scrollbar-hide pl-1.5'>
                  <div className='flex gap-2 items-center h-full whitespace-nowrap relative'>
                    {selectedBadges.map((badgeId, index) => (
                      <div
                        key={badgeId}
                        className={`relative group flex-shrink-0 inline-flex items-center py-1 ${
                          index === selectedBadges.length - 1 ? 'mr-2' : ''
                        }`}
                      >
                        <StudentBadge
                          type={badgeId as StudentBadgeTypeIds}
                          className='pr-3'
                        />
                        <button
                          className='absolute -top-0 -right-1 h-4 w-4 p-0 rounded-full bg-accent border 
                           border-muted-foreground/20 flex 
                           items-center justify-center 
                           hover:border-muted-foreground/50
                           transition-all duration-150 ease-in cursor-default'
                          onClick={(e) => handleRemoveBadge(badgeId, e)}
                        >
                          <X className='h-3 w-3' />
                        </button>
                      </div>
                    ))}
                    {/* Sticky Add More Button */}
                    <div className='sticky right-2 flex-shrink-0 ml-auto transition-opacity duration-150 ease-in flex items-center'>
                      <div
                        className='h-6 w-6 rounded-full bg-accent 
                      border border-muted-foreground/20
                      flex 
                      group-hover:border-muted-foreground/60
                      items-center justify-center transition-colors cursor-pointer'
                      >
                        <Plus className='h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors' />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className='absolute inset-0 flex items-center justify-center gap-2 text-muted-foreground'>
                <Plus className='h-4 w-4' />
                <span className='text-sm'>Add student badges</span>
              </div>
            )}
          </div>
        </PopoverTrigger>

        <PopoverContent
          className='w-[calc(100vw-5rem)] sm:w-[calc(600px-3rem)]'
          align='center'
          onWheel={(e) => e.stopPropagation()}
        >
          <div className='space-y-4'>
            <div className='space-y-1'>
              <h4 className='font-medium text-sm'>Available Badges</h4>
            </div>

            <div className='grid grid-cols-2 gap-2'>
              {STUDENT_BADGE_TYPES.map((badgeType) => {
                const isSelected = selectedBadges.includes(badgeType.id);

                return (
                  <div
                    key={badgeType.id}
                    className={`p-3 rounded-lg cursor-pointer transition-all ${
                      isSelected ? 'bg-accent' : 'hover:bg-accent'
                    }`}
                    onClick={() => handleBadgeToggle(badgeType.id)}
                  >
                    <div className='space-y-1'>
                      <div className='flex items-center gap-2'>
                        <div
                          className={`p-1.5 rounded-full ${
                            {
                              'initiative-taker': 'bg-[#FDF2F8]',
                              'imaginative-mind': 'bg-[#ECFEFF]',
                              'detail-detective': 'bg-[#EFEBE9]',
                              'question-star': 'bg-[#E0F2F1]',
                              'group-energizer': 'bg-[#FCF4DB]',
                              'effort-champion': 'bg-[#EFEAFF]',
                              'image-savvy': 'bg-[#E5F3FE]',
                              'math-whiz': 'bg-[#E1FAE8]',
                              'story-teller': 'bg-[#F1F1F1]',
                              'tech-explorer': 'bg-[#FDEFEE]',
                            }[badgeType.id]
                          }`}
                        >
                          <div
                            style={{
                              color: {
                                'initiative-taker': '#DB2777',
                                'imaginative-mind': '#0891B2',
                                'detail-detective': '#6D4C41',
                                'question-star': '#00796B',
                                'group-energizer': '#E6961F',
                                'effort-champion': '#6D3CFA',
                                'image-savvy': '#008DFF',
                                'math-whiz': '#37C25C',
                                'story-teller': '#787878',
                                'tech-explorer': '#EC6A5B',
                              }[badgeType.id],
                            }}
                          >
                            <badgeType.icon className='h-4 w-4' />
                          </div>
                        </div>
                        <span
                          className='text-sm font-medium truncate text-foreground'
                          style={{
                            color: {
                              'initiative-taker': '#DB2777',
                              'imaginative-mind': '#0891B2',
                              'detail-detective': '#6D4C41',
                              'question-star': '#00796B',
                              'group-energizer': '#E6961F',
                              'effort-champion': '#6D3CFA',
                              'image-savvy': '#008DFF',
                              'math-whiz': '#37C25C',
                              'story-teller': '#787878',
                              'tech-explorer': '#EC6A5B',
                            }[badgeType.id],
                          }}
                        >
                          {badgeType.name}
                        </span>
                      </div>
                      <p className='text-xs text-muted-foreground leading-relaxed truncate'>
                        {badgeType.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className='pt-3 border-t'>
              <div className='flex items-center justify-between text-xs text-muted-foreground'>
                <span>Selected: {selectedBadges.length}/10 badges</span>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => {
                    onBadgeChange([]);
                    setIsOpen(false);
                  }}
                  className='text-xs'
                >
                  Clear all
                </Button>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
