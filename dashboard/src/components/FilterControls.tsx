import { useState } from 'react';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Button } from '../components/ui/button';
import type { ChangeEvent } from 'react';

interface FilterControlsProps {
  status: string;
  search: string;
  onStatusChange: (status: string) => void;
  onSearchChange: (search: string) => void;
}

export function FilterControls({ status, search, onStatusChange, onSearchChange }: FilterControlsProps) {
  const [searchInput, setSearchInput] = useState(search);

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    onSearchChange(value);
  };

  return (
    <div className="flex flex-wrap gap-4 mb-6">
      <Input
        type="search"
        placeholder="Search by customer name..."
        value={searchInput}
        onChange={(e: ChangeEvent<HTMLInputElement>) => handleSearchChange(e.target.value)}
        className="w-64"
      />

      <Select value={status} onValueChange={onStatusChange}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All statuses</SelectItem>
          <SelectItem value="new">New</SelectItem>
          <SelectItem value="confirmed">Confirmed</SelectItem>
          <SelectItem value="processing">Processing</SelectItem>
          <SelectItem value="shipped">Shipped</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
          <SelectItem value="cancelled">Cancelled</SelectItem>
        </SelectContent>
      </Select>

      {(status || searchInput) && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            onStatusChange('');
            handleSearchChange('');
          }}
        >
          Clear filters
        </Button>
      )}
    </div>
  );
}