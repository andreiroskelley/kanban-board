'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableCard } from './SortableCard';
import { CardItem } from '@/app/page';

interface ColumnDropZoneProps {
  column: {
    id: string;
    name: string;
    status: string;
    cards: CardItem[];
  };
  onDelete: (cardId: string) => void;
}

export function ColumnDropZone({ column, onDelete }: ColumnDropZoneProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: {
      type: 'column',
      columnId: column.id,
    },
  });

  // Get card IDs for SortableContext
  const cardIds = column.cards.map(card => card.id);

  // Determine column colors based on status
  const getColumnColors = (status: string) => {
    switch (status) {
      case 'stuck':
        return {
          bg: 'bg-red-50',
          border: 'border-b-2 border-red-200',
          hoverRing: 'ring-red-500'
        };
      case 'not_started':
        return {
          bg: 'bg-gray-50',
          border: 'border-b-2 border-gray-200',
          hoverRing: 'ring-gray-500'
        };
      case 'working_on_it':
        return {
          bg: 'bg-yellow-50',
          border: 'border-b-2 border-yellow-200',
          hoverRing: 'ring-yellow-500'
        };
      case 'done':
        return {
          bg: 'bg-green-50',
          border: 'border-b-2 border-green-200',
          hoverRing: 'ring-green-500'
        };
      case 'test':
      default:
        return {
          bg: 'bg-purple-50',
          border: 'border-b-2 border-purple-200',
          hoverRing: 'ring-purple-500'
        };
    }
  };

  const colors = getColumnColors(column.status);

  return (
    <div 
      ref={setNodeRef}
      className={`bg-white rounded-lg shadow-lg ${isOver ? `ring-2 ${colors.hoverRing} ring-offset-2` : ''}`}
    >
      {/* Column Header with colored background */}
      <div className={`p-4 rounded-t-lg ${colors.bg} ${colors.border}`}>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900">{column.name}</h3>
            {/* Optional: Add a small colored indicator dot */}
            <div className={`w-2 h-2 rounded-full ${
              column.status === 'stuck' ? 'bg-red-400' :
              column.status === 'not_started' ? 'bg-gray-400' :
              column.status === 'working_on_it' ? 'bg-yellow-400' :
              column.status === 'done' ? 'bg-green-400' :
              'bg-purple-400'
            }`}></div>
          </div>
          <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
            column.status === 'stuck' ? 'bg-red-100 text-red-800' :
            column.status === 'not_started' ? 'bg-gray-100 text-gray-800' :
            column.status === 'working_on_it' ? 'bg-yellow-100 text-yellow-800' :
            column.status === 'done' ? 'bg-green-100 text-green-800' :
            'bg-purple-100 text-purple-800'
          }`}>
            {column.cards.length}
          </span>
        </div>
      </div>
      
      {/* Cards List */}
      <div className="p-4 space-y-3 min-h-[200px] max-h-[600px] overflow-y-auto">
        {column.cards.length === 0 ? (
          <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-300 rounded-lg">
            <p>No tasks</p>
            <p className="text-xs mt-2">Drop tasks here</p>
          </div>
        ) : (
          <SortableContext 
            items={cardIds} 
            strategy={verticalListSortingStrategy}
          >
            {column.cards.map(card => (
              <SortableCard
                key={card.id}
                card={card}
                onDelete={onDelete}
                columnId={column.id} // Pass column ID to card
              />
            ))}
          </SortableContext>
        )}
      </div>
    </div>
  );
}