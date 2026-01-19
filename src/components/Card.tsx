'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Trash2 } from 'lucide-react';

interface CardItem {
  id: string;
  title: string;
  description?: string;
  status: string;
  position: number;
  created_at: string;
}

interface CardProps {
  card: CardItem;
  onDelete: (cardId: string) => void;
  isDragging?: boolean;
}

export function Card({ card, onDelete, isDragging = false }: CardProps) {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(card.id);
  };

  return (
    <div
      className={`
        border border-gray-200 rounded-lg p-4 
        ${isDragging ? 'shadow-xl rotate-2 scale-105' : 'hover:shadow-md'} 
        transition-all duration-150
        bg-white cursor-grab active:cursor-grabbing
      `}
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-medium text-gray-900">{card.title}</h4>
        <button
          onClick={handleDelete}
          className="text-gray-400 hover:text-red-500 p-1 rounded-full hover:bg-red-50"
          title="Delete task"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      
      {card.description && (
        <p className="text-sm text-gray-600 mb-3">{card.description}</p>
      )}
    </div>
  );
}