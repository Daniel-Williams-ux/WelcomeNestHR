'use client';

import { Button } from '@/components/ui/button';

type Props = {
  hasNext: boolean;
  hasPrev: boolean;
  onNext: () => void;
  onPrev: () => void;
};

export default function PaginationControls({
  hasNext,
  hasPrev,
  onNext,
  onPrev,
}: Props) {
  return (
    <div className="flex justify-end gap-2 pt-4">
      <Button variant="outline" disabled={!hasPrev} onClick={onPrev}>
        Previous
      </Button>
      <Button variant="outline" disabled={!hasNext} onClick={onNext}>
        Next
      </Button>
    </div>
  );
}
