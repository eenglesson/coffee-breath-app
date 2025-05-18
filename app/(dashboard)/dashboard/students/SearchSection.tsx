'use client';
import { Button } from '@/components/ui/button';
import AddStudentDialog from './AddStudentDialog';
import { SearchIcon, UserPlus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

interface SearchSectionProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

export default function SearchSection({
  searchTerm,
  setSearchTerm,
}: SearchSectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleAddStudent = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <header className='flex gap-4 mb-4'>
        <div className='flex-1'>
          <div className='relative max-w-64'>
            <Input
              className='peer ps-9 truncate placeholder:text-sm'
              placeholder='Search by name or class...'
              value={searchTerm}
              onChange={handleSearchChange}
            />
            <div className='text-muted-foreground/80 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50'>
              <SearchIcon size={16} />
            </div>
          </div>
        </div>
        <div>
          <Button onClick={handleAddStudent}>
            <UserPlus className='mr-2 h-4 w-4' /> Add Student
          </Button>
        </div>
      </header>

      {isModalOpen && <AddStudentDialog onClose={closeModal} />}
    </>
  );
}
