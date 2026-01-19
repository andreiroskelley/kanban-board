// src/app/page.tsx
'use client'
import { useSearchParams } from 'next/navigation'
import { useAuthenticationStatus, useNhostClient } from '@nhost/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

// DND Kit imports
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { SortableCard } from '@/components/SortableCard';
import { Card } from '@/components/Card';
import { ColumnDropZone } from '@/components/ColumnDropZone'

export interface CardItem {
  id: string;
  title: string;
  description?: string;
  status: 'stuck' | 'not_started' | 'working_on_it' | 'done' | 'test';
  position: number;
  created_at: string;
  board_id: string;
}

export interface Column {
  id: string;
  name: string;
  status: CardItem['status'];
  cards: CardItem[];
}

export default function HomePage() {
  const searchParams = useSearchParams()
  const boardId = searchParams.get('boardId')
  
  const router = useRouter()
  const { isAuthenticated } = useAuthenticationStatus()
  const nhost = useNhostClient()
  
  const [boardName, setBoardName] = useState('')
  const [columns, setColumns] = useState<Column[]>([
    { id: '1', name: 'Stuck', status: 'stuck', cards: [] },
    { id: '2', name: 'Not Started', status: 'not_started', cards: [] },
    { id: '3', name: 'Working On It', status: 'working_on_it', cards: [] },
    { id: '4', name: 'Done', status: 'done', cards: [] },
    { id: '5', name: 'Test', status: 'test', cards: [] }
  ])
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newCardTitle, setNewCardTitle] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<CardItem['status']>('not_started')
  
  // DND Kit state
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeCard, setActiveCard] = useState<CardItem | null>(null);

  // Configure sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/signin')
    }
  }, [isAuthenticated, router])
  
  useEffect(() => {
    if (!isAuthenticated || !boardId) return
    
    async function fetchBoardData() {
      try {
        setLoading(true)
        setError(null)
        
        // 1. Fetch board details
        const boardResult = await nhost.graphql.request(`
          query GetBoard($boardId: uuid!) {
            boards_by_pk(id: $boardId) {
              id
              name
              description
              created_at
            }
          }
        `, { boardId })
        
        if (boardResult.data?.boards_by_pk) {
          setBoardName(boardResult.data.boards_by_pk.name)
        }
        
        // 2. Fetch cards for this board
        const cardsResult = await nhost.graphql.request(`
          query GetBoardCards($boardId: uuid!) {
            cards(
              where: { board_id: { _eq: $boardId } }
              order_by: { position: asc }
            ) {
              id
              title
              description
              status
              position
              created_at
              board_id
            }
          }
        `, { boardId })
        
        console.log('Cards result:', cardsResult)
        
        if (cardsResult.data?.cards) {
          // Group cards by status
          const cardsByStatus = cardsResult.data.cards.reduce((acc: Record<string, CardItem[]>, card: CardItem) => {
            if (!acc[card.status]) {
              acc[card.status] = []
            }
            acc[card.status].push(card)
            return acc
          }, {})
          
          // Update columns with fetched cards
          setColumns(prev => prev.map(col => ({
            ...col,
            cards: cardsByStatus[col.status] || []
          })))
        } else if (cardsResult.error) {
          console.log('cards error:', cardsResult.error)
        }
        
      } catch (err: any) {
        console.error('Fetch error:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    
    fetchBoardData()
  }, [isAuthenticated, boardId, nhost])

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    
    // Find the active card
    for (const column of columns) {
      const card = column.cards.find(c => c.id === active.id);
      if (card) {
        setActiveCard(card);
        break;
      }
    }
  };

  // Handle drag end
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveId(null);
      setActiveCard(null);
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find the active card and its column
    let activeCard: CardItem | null = null;
    let sourceColumn: Column | null = null;
    
    for (const column of columns) {
      const card = column.cards.find(c => c.id === activeId);
      if (card) {
        activeCard = card;
        sourceColumn = column;
        break;
      }
    }

    if (!activeCard || !sourceColumn || !boardId) {
      setActiveId(null);
      setActiveCard(null);
      return;
    }

    // Get the target column from over.data.current
    const targetColumnId = over.data.current?.columnId;
    const targetColumn = columns.find(col => col.id === targetColumnId);

    // If dropping on a card within the same SortableContext
    if (over.data.current?.type === 'card') {
      const targetCardId = over.id as string;
      const targetCard = targetColumn?.cards.find(c => c.id === targetCardId);
      
      if (targetCard && targetColumn) {
        // Same column reordering
        if (sourceColumn.id === targetColumn.id) {
          await reorderCardsInColumn(activeCard, targetCard, sourceColumn);
        } else {
          // Different column
          await moveCardToOtherColumn(activeCard, targetCard, sourceColumn, targetColumn);
        }
      }
    } 
    // If dropping on column (empty space)
    else if (targetColumn) {
      if (sourceColumn.id !== targetColumn.id) {
        await moveCardToColumn(activeCard, sourceColumn, targetColumn);
      }
    }

    setActiveId(null);
    setActiveCard(null);
  };

  // Helper function: Reorder cards within same column
  const reorderCardsInColumn = async (activeCard: CardItem, targetCard: CardItem, column: Column) => {
    const oldIndex = column.cards.findIndex(c => c.id === activeCard.id);
    const newIndex = column.cards.findIndex(c => c.id === targetCard.id);
    
    if (oldIndex === newIndex) return;
    
    const newCards = arrayMove(column.cards, oldIndex, newIndex);
    
    // Update positions (space them out)
    const updatedCards = newCards.map((card, index) => ({
      ...card,
      position: (index + 1) * 1000,
    }));
    
    // Update local state
    setColumns(prev => prev.map(col => 
      col.status === column.status 
        ? { ...col, cards: updatedCards }
        : col
    ));
    
    // Update the moved card's position in database
    const movedCard = updatedCards.find(c => c.id === activeCard.id);
    if (movedCard && boardId) {
      await updateCardPosition(activeCard.id, movedCard.position);
    }
  };

  // Helper function: Move card to different column
  const moveCardToColumn = async (activeCard: CardItem, sourceColumn: Column, targetColumn: Column) => {
    // Remove from source
    const sourceCards = sourceColumn.cards.filter(c => c.id !== activeCard.id);
    
    // Add to target at the end
    const newPosition = targetColumn.cards.length > 0 
      ? Math.max(...targetColumn.cards.map(c => c.position)) + 1000
      : 1000;
    
    const updatedCard = { 
      ...activeCard, 
      status: targetColumn.status, 
      position: newPosition 
    };
    
    const targetCards = [...targetColumn.cards, updatedCard];
    
    // Update local state
    setColumns(prev => prev.map(col => {
      if (col.status === sourceColumn.status) {
        return { ...col, cards: sourceCards };
      }
      if (col.status === targetColumn.status) {
        return { ...col, cards: targetCards };
      }
      return col;
    }));
    
    // Update in database
    if (boardId) {
      await updateCardStatusAndPosition(activeCard.id, targetColumn.status, newPosition);
    }
  };

  // Helper function: Move card to different column (dropping on a card)
  const moveCardToOtherColumn = async (
    activeCard: CardItem, 
    targetCard: CardItem, 
    sourceColumn: Column, 
    targetColumn: Column
  ) => {
    // Remove from source
    const sourceCards = sourceColumn.cards.filter(c => c.id !== activeCard.id);
    
    // Find position in target column (insert before target card)
    const targetIndex = targetColumn.cards.findIndex(c => c.id === targetCard.id);
    const newPosition = targetIndex >= 0 
      ? targetColumn.cards[targetIndex].position - 500
      : Math.max(...targetColumn.cards.map(c => c.position)) + 1000;
    
    const updatedCard = { 
      ...activeCard, 
      status: targetColumn.status, 
      position: newPosition 
    };
    
    const targetCards = [...targetColumn.cards];
    if (targetIndex >= 0) {
      targetCards.splice(targetIndex, 0, updatedCard);
    } else {
      targetCards.push(updatedCard);
    }
    
    // Update local state
    setColumns(prev => prev.map(col => {
      if (col.status === sourceColumn.status) {
        return { ...col, cards: sourceCards };
      }
      if (col.status === targetColumn.status) {
        return { ...col, cards: targetCards };
      }
      return col;
    }));
    
    // Update in database
    if (boardId) {
      await updateCardStatusAndPosition(activeCard.id, targetColumn.status, newPosition);
    }
  };

  const updateCardPosition = async (cardId: string, newPosition: number) => {
    try {
      await nhost.graphql.request({
        document: `
          mutation UpdateCardPosition($cardId: uuid!, $position: Float!) {
            update_cards_by_pk(
              pk_columns: { id: $cardId }
              _set: { position: $position }
            ) {
              id
              position
            }
          }
        `,
        variables: { cardId, position: newPosition }
      });
    } catch (err) {
      console.error('Update position error:', err);
    }
  };

  const updateCardStatusAndPosition = async (cardId: string, newStatus: string, newPosition: number) => {
    try {
      await nhost.graphql.request({
        document: `
          mutation UpdateCard($cardId: uuid!, $status: String!, $position: Float!) {
            update_cards_by_pk(
              pk_columns: { id: $cardId }
              _set: { status: $status, position: $position }
            ) {
              id
              status
              position
            }
          }
        `,
        variables: { cardId, status: newStatus, position: newPosition }
      });
    } catch (err) {
      console.error('Update card error:', err);
    }
  };

  // Add this helper function inside your component (right after the state declarations)
const extractErrorMessage = (error: any): string => {
  if (Array.isArray(error)) {
    return error.map(err => {
      // Handle GraphQL error objects
      if (err?.message) return err.message;
      if (err?.extensions?.code) return `${err.extensions.code}: ${err.message || 'Unknown error'}`;
      return JSON.stringify(err);
    }).join(', ');
  }
  if (error?.message) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return JSON.stringify(error);
};


  const handleAddCard = async () => {
    if (!newCardTitle.trim() || !boardId) return
    
    try {
      const position = Date.now();
      
      console.log('📝 Adding card with:', {
        title: newCardTitle,
        status: selectedStatus,
        position,
        boardId
      });
  
      // Try with variables instead of string interpolation
      const result = await nhost.graphql.request(`
        mutation AddCard($title: String!, $status: String!, $position: Float!, $board_id: uuid!) {
          insert_cards_one(object: {
            title: $title,
            status: $status,
            position: $position,
            board_id: $board_id
          }) {
            id
            title
            status
            position
            created_at
            board_id
          }
        }
      `, {
        title: newCardTitle.trim(),
        status: selectedStatus,
        position,
        board_id:boardId
      });
      
      console.log('📊 Add card result:', JSON.stringify(result, null, 2));
      
      if (result.data?.insert_cards_one) {
        const newCard = result.data.insert_cards_one;
        console.log('✅ Card added:', newCard);
        
        // Update local state
        setColumns(prev => prev.map(col => 
          col.status === newCard.status 
            ? { ...col, cards: [...col.cards, newCard] }
            : col
        ));
        
        setNewCardTitle('');
      } else if (result.error) {
        console.error('❌ Add card error details:', result.error);
        
        // Extract and display the error
        const errorMessage = extractErrorMessage(result.error);
        setError('Failed to add card: ' + errorMessage);
      }
    } catch (err: any) {
      console.error('🔥 Add card error:', err);
      const errorMessage = extractErrorMessage(err);
      setError('Failed to add card: ' + errorMessage);
    }
  }

  const handleDeleteCard = async (cardId: string) => {
    try {
      await nhost.graphql.request(`
        mutation DeleteCard {
          delete_cards_by_pk(id: "${cardId}") {
            id
          }
        }
      `)
      
      // Update local state
      setColumns(prev => prev.map(col => ({
        ...col,
        cards: col.cards.filter(card => card.id !== cardId)
      })))
    } catch (err) {
      console.error('Delete card error:', err)
    }
  }

  if (!boardId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">No Board Selected</h1>
          <p className="text-gray-600 mb-6">Please select a board from your boards list.</p>
          <a 
            href="/boards"
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
          >
            Go to My Boards
          </a>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading board...</p>
      </div>
    </div>
  )
  
  if (error) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
        <h3 className="text-lg font-semibold text-red-800">Error</h3>
        <p className="text-red-700 mt-2">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    </div>
  )

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header with board info */}
          <div className="mb-8">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{boardName}</h1>
                <p className="text-gray-600 mt-2">Drag and drop tasks between columns</p>
              </div>
              <a 
                href="/boards"
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Boards
              </a>
            </div>
          </div>
          
          {/* Add Card Form */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Add New Task</h2>
            <div className="flex flex-col md:flex-row gap-4">
              <input
                type="text"
                value={newCardTitle}
                onChange={(e) => setNewCardTitle(e.target.value)}
                placeholder="Enter task title..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyPress={(e) => e.key === 'Enter' && handleAddCard()}
              />
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as CardItem['status'])}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {columns.map(col => (
                  <option key={col.id} value={col.status}>{col.name}</option>
                ))}
              </select>
              <button
                onClick={handleAddCard}
                disabled={!newCardTitle.trim()}
                className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Add Task
              </button>
            </div>
          </div>
          
          {/* Kanban Board */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {columns.map(column => (
              <ColumnDropZone
                key={column.id}
                column={column}
                onDelete={handleDeleteCard}
              />
            ))}
          </div>
          
          {/* Drag Overlay */}
          <DragOverlay>
            {activeCard && (
              <Card 
                card={activeCard} 
                onDelete={() => {}} 
                isDragging 
              />
            )}
          </DragOverlay>
        </div>
      </div>
    </DndContext>
  )
}