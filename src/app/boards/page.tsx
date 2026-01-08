'use client'
import { gql } from '@apollo/client'
import { useQuery } from '@apollo/client/react'
import { useAuthenticationStatus } from '@nhost/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

const BOARDS = gql`
  query Boards {
    boards(order_by: {created_at: desc}) {
      id
      name
    }
  }
`

interface Board {
  id: string;
  name: string;
}

interface QueryData {
  boards: Board[];
}

export default function BoardsPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuthenticationStatus()
  
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/signin')
    }
  }, [isAuthenticated, router])
  
  const { data, loading, error } = useQuery<QueryData>(BOARDS, { 
    skip: !isAuthenticated 
  })

  if (!isAuthenticated || loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>
  )
  
  if (error) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
        <h3 className="text-lg font-semibold text-red-800">Error</h3>
        <p className="text-red-700 mt-2">{error.message}</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Boards</h1>
          
          {data?.boards.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No boards found.</p>
            </div>
          ) : (
            <ul className="space-y-4">
              {data?.boards.map((board) => (
                <li key={board.id} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900">{board.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">ID: {board.id}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}