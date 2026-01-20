'use client'
import { useAuthenticationStatus, useNhostClient } from '@nhost/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'

export interface Board {
  id: string
  name: string
  description?: string
  created_at: string
  updated_at: string
  user_id: string
  card_count?: number
}

export default function BoardsListPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useAuthenticationStatus()
  const nhost = useNhostClient()
  
  const [boards, setBoards] = useState<Board[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newBoardName, setNewBoardName] = useState('')
  const [newBoardDescription, setNewBoardDescription] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    if (!isAuthenticated && !authLoading) {
      router.push('/signin')
    }
  }, [isAuthenticated, authLoading, router])

  useEffect(() => {
    if (!isAuthenticated || authLoading) return
    
    fetchBoards()
  }, [isAuthenticated, authLoading])

  // Helper function to extract error messages
  const extractErrorMessage = (error: any): string => {
    if (Array.isArray(error)) {
      return error.map(err => err.message || String(err)).join(', ')
    }
    if (error?.message) {
      return error.message
    }
    if (typeof error === 'string') {
      return error
    }
    return JSON.stringify(error)
  }

  const fetchBoards = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Get current user
      const user = nhost.auth.getUser()
      if (!user) {
        setError('You must be logged in to view boards')
        setLoading(false)
        return
      }
      
      console.log('👤 Current user ID:', user.id)
      
      // Fetch boards from boards_view with user filter
      const result = await nhost.graphql.request(`
        query GetUserBoards($userId: uuid!) {
          boards_view(
            where: { user_id: { _eq: $userId } }
            order_by: { updated_at: desc }
          ) {
            id
            name
            description
            created_at
            updated_at
            user_id
          }
        }
      `, { 
        userId: user.id 
      })
      
      console.log('📊 Boards query result:', result)
      
      if (result.data?.boards_view) {
        console.log(`✅ Found ${result.data.boards_view.length} boards`)
        
        // For each board, fetch card count from cards table
        const boardsWithCounts = await Promise.all(
          result.data.boards_view.map(async (board: any) => {
            try {
              const cardsResult = await nhost.graphql.request(`
                query GetCardCount($boardId: uuid!) {
                  cards_aggregate(where: { board_id: { _eq: $boardId } }) {
                    aggregate {
                      count
                    }
                  }
                }
              `, { boardId: board.id })
              
              return {
                ...board,
                card_count: cardsResult.data?.cards_aggregate?.aggregate?.count || 0
              }
            } catch {
              return {
                ...board,
                card_count: 0
              }
            }
          })
        )
        
        setBoards(boardsWithCounts)
      } else if (result.error) {
        console.error('❌ GraphQL error:', result.error)
        
        const errorMessage = extractErrorMessage(result.error)
        
        // If boards_view doesn't work, fall back to boards table
        if (errorMessage.includes('boards_view') || errorMessage.includes('not found')) {
          console.log('🔄 Falling back to boards table...')
          await fetchBoardsFallback(user.id)
        } else {
          setError('Failed to load boards: ' + errorMessage)
        }
      }
    } catch (err: any) {
      console.error('🔥 Fetch error:', err)
      const errorMessage = extractErrorMessage(err)
      setError('Failed to load boards: ' + errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // Fallback function if boards_view doesn't work
  const fetchBoardsFallback = async (userId: string) => {
    try {
      console.log('🔄 Using fallback: querying boards table')
      
      const result = await nhost.graphql.request(`
        query GetUserBoardsFallback($userId: uuid!) {
          boards(
            where: { user_id: { _eq: $userId } }
            order_by: { updated_at: desc }
          ) {
            id
            name
            description
            created_at
            updated_at
            user_id
          }
        }
      `, { 
        userId 
      })
      
      if (result.data?.boards) {
        console.log(`✅ Found ${result.data.boards.length} boards (fallback)`)
        
        const boardsWithCounts = await Promise.all(
          result.data.boards.map(async (board: any) => {
            try {
              const cardsResult = await nhost.graphql.request(`
                query GetCardCount($boardId: uuid!) {
                  cards_aggregate(where: { board_id: { _eq: $boardId } }) {
                    aggregate {
                      count
                    }
                  }
                }
              `, { boardId: board.id })
              
              return {
                ...board,
                card_count: cardsResult.data?.cards_aggregate?.aggregate?.count || 0
              }
            } catch {
              return {
                ...board,
                card_count: 0
              }
            }
          })
        )
        
        setBoards(boardsWithCounts)
      }
    } catch (fallbackErr) {
      console.error('🔥 Fallback fetch error:', fallbackErr)
      setError('Failed to load boards from both tables')
    }
  }

  const handleCreateBoard = async () => {
    if (!newBoardName.trim() || isCreating) return
    
    try {
      setIsCreating(true)
      const user = nhost.auth.getUser()
      if (!user) {
        setError('You must be logged in to create a board')
        setIsCreating(false)
        return
      }

      console.log('➕ Creating board for user:', user.id)

      // First try to insert into boards_view
      let result
      try {
        result = await nhost.graphql.request(`
          mutation CreateBoard($name: String!, $description: String, $userId: uuid!) {
            insert_boards_view_one(object: {
              name: $name,
              description: $description,
              user_id: $userId
            }) {
              id
              name
              description
              created_at
              updated_at
              user_id
            }
          }
        `, {
          name: newBoardName.trim(),
          description: newBoardDescription.trim() || null,
          userId: user.id
        })
      } catch (viewError) {
        console.log('❌ Could not insert into boards_view, trying boards table...')
        
        // Fallback to inserting into boards table
        result = await nhost.graphql.request(`
          mutation CreateBoardFallback($name: String!, $description: String, $userId: uuid!) {
            insert_boards_one(object: {
              name: $name,
              description: $description,
              user_id: $userId
            }) {
              id
              name
              description
              created_at
              updated_at
              user_id
            }
          }
        `, {
          name: newBoardName.trim(),
          description: newBoardDescription.trim() || null,
          userId: user.id
        })
      }

      console.log('Create result:', result)

      if (result.data?.insert_boards_view_one || result.data?.insert_boards_one) {
        const newBoard = result.data.insert_boards_view_one || result.data.insert_boards_one
        
        // Show success message
        setError(`✅ Board "${newBoard.name}" created successfully!`)
        
        // Clear form
        setNewBoardName('')
        setNewBoardDescription('')
        setShowCreateModal(false)
        
        // Wait a moment for database sync
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Refresh the boards list
        await fetchBoards()
        
        // Redirect to the new board
        router.push(`/boards/`)
        
      } else if (result.error) {
        console.error('Create error:', result.error)
        const errorMsg = extractErrorMessage(result.error)
        setError('Failed to create board: ' + errorMsg)
      }
    } catch (err: any) {
      console.error('Create error:', err)
      const errorMsg = extractErrorMessage(err)
      setError('Failed to create board: ' + errorMsg)
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteBoard = async (boardId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    console.log('Attempting to delete board:', boardId)
    
    if (!confirm('Are you sure you want to delete this board? All cards will be deleted.')) {
      return
    }
    
    try {
      await nhost.graphql.request(`
        mutation DeleteBoardWithCards($boardId: uuid!) {
          # Delete all cards associated with this board
          delete_cards(where: {board_id: {_eq: $boardId}}) {
            affected_rows
          }
          # Then delete the board itself
          delete_boards_by_pk(id: $boardId) {
            id
          }
        }
      `, {
        boardId
      })
      
      // Update local state
      setBoards(prev => prev.filter(board => board.id !== boardId))
      
      // Show success message
      setError('✅ Board deleted successfully!')
      setTimeout(() => setError(null), 3000)
    } catch (err) {
      console.error('Delete board error:', err)
      setError('Failed to delete board')
    }
  }

  // Add debug info
  useEffect(() => {
    console.log('🔍 Debug - Boards state:', boards)
    console.log('🔍 Debug - First board:', boards[0])
  }, [boards])

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading boards...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Boards</h1>
              <p className="text-gray-600 mt-2">Select or create a kanban board</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Board
            </button>
          </div>
        </div>

        {/* Error/Success Message */}
        {error && (
          <div className={`mb-6 p-4 rounded-lg ${
            error.includes('✅') 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                {error}
              </div>
              <button
                onClick={() => setError(null)}
                className="ml-4 text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Boards Grid */}
        {boards.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg shadow">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No boards yet</h3>
            <p className="text-gray-600 mb-6">Create your first kanban board to start organizing tasks</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
            >
              Create First Board
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {boards.map(board => (
              <Link
                key={board.id}
                href={`/?boardId=${board.id}`}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-300 border border-gray-200 hover:border-blue-300 group block"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg group-hover:text-blue-600 transition-colors">
                        {board.name}
                      </h3>
                      {board.description && (
                        <p className="text-gray-600 text-sm mt-2 line-clamp-2">
                          {board.description}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={(e) => handleDeleteBoard(board.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition"
                      title="Delete board"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        {board.card_count || 0} cards
                      </span>
                    </div>
                    <span className="text-xs" title={`Updated: ${new Date(board.updated_at).toLocaleString()}`}>
                      {new Date(board.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Create Board Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Board</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Board Name *
                  </label>
                  <input
                    type="text"
                    value={newBoardName}
                    onChange={(e) => setNewBoardName(e.target.value)}
                    placeholder="e.g., Project Alpha"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    autoFocus
                    onKeyPress={(e) => e.key === 'Enter' && handleCreateBoard()}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (Optional)
                  </label>
                  <textarea
                    value={newBoardDescription}
                    onChange={(e) => setNewBoardDescription(e.target.value)}
                    placeholder="Brief description of this board..."
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
                  disabled={isCreating}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateBoard}
                  disabled={!newBoardName.trim() || isCreating}
                  className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
                >
                  {isCreating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Creating...
                    </>
                  ) : (
                    'Create Board'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}