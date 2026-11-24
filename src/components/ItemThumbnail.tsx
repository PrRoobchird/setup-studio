import React from 'react';
import { FurnitureIllustration } from './FurnitureIllustration';

interface ItemThumbnailProps {
  itemId: string;
  className?: string;
}

export const ItemThumbnail: React.FC<ItemThumbnailProps> = ({ itemId, className = 'w-14 h-14' }) => {
  return (
    <svg
      viewBox="-46 -88 92 114"
      className={className}
      aria-hidden="true"
    >
      <FurnitureIllustration itemId={itemId} />
    </svg>
  );
};
