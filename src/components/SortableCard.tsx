'use client'
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from './Card';
import { CardItem } from '@/app/page';

interface SortableCardProps {
  card: CardItem;
  onDelete: (cardId: string) => void;
  columnId: string; // Add this line to the interface
}

export function SortableCard({ card, onDelete, columnId }: SortableCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card.id, // This must match the card's actual ID
    data: {
      type: 'card',
      card,
      columnId, // Pass column ID in data
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={isDragging ? 'opacity-50' : ''}
    >
      <Card 
        card={card} 
        onDelete={onDelete} 
        isDragging={isDragging}
      />
    </div>
  );
}