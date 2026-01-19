'use client'
import { useAuthenticationStatus, useUserData } from '@nhost/nextjs'

export default function TestPage() {
  const { isAuthenticated, isLoading } = useAuthenticationStatus()
  const user = useUserData()
  
  console.log('Auth status:', { isAuthenticated, isLoading, user })
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Auth Test</h1>
      <div className="bg-gray-100 p-4 rounded">
        <p>Loading: {isLoading ? 'Yes' : 'No'}</p>
        <p>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</p>
        <p>User ID: {user?.id || 'None'}</p>
        <p>User Email: {user?.email || 'None'}</p>
        <p>Display Name: {user?.displayName || 'None'}</p>
      </div>
    </div>
  )
}