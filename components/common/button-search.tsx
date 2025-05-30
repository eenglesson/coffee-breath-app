import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { GlobeIcon } from 'lucide-react';
import React from 'react';

type ButtonSearchProps = {
  isSelected?: boolean;
  onToggle?: (isSelected: boolean) => void;
  isAuthenticated: boolean;
};

export function ButtonSearch({
  isSelected = false,
  onToggle,
}: ButtonSearchProps) {
  const handleClick = () => {
    const newState = !isSelected;
    onToggle?.(newState);
  };

  // if (!isAuthenticated) {
  //   return (
  //     <Popover>
  //       <PopoverTrigger asChild>
  //         <Button
  //           variant='secondary'
  //           className='border-border dark:bg-secondary rounded-full border bg-transparent'
  //         >
  //           <GlobeIcon className='size-4' />
  //           Search
  //         </Button>
  //       </PopoverTrigger>
  //       {/* <PopoverContentAuth /> */}
  //     </Popover>
  //   );
  // }

  return (
    <Button
      variant='secondary'
      className={cn(
        'rounded-full text-muted-foreground hover:text-foreground border border-border transition-all duration-150',
        isSelected &&
          '!border-[#0091FF]/30  !text-[#0091FF] hover:!text-[#0091FF]'
      )}
      onClick={handleClick}
    >
      <GlobeIcon className='size-4' />
      Search
    </Button>
  );
}
