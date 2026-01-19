// app/test-graphql/page.tsx
'use client'

import { useNhostClient } from '@nhost/nextjs'
import { useEffect, useState } from 'react'

export default function TestGraphQLPage() {
  const nhost = useNhostClient()
  const [tables, setTables] = useState<string[]>([])
  
  useEffect(() => {
    async function checkTables() {
      const result = await nhost.graphql.request(`
        query CheckTables {
          __schema {
            queryType {
              fields {
                name
              }
            }
          }
        }
      `)
      
      const available = result.data?.__schema?.queryType?.fields
        .map((f: any) => f.name)
        .filter((name: string) => !name.startsWith('__'))
      
      setTables(available || [])
      console.log('Available GraphQL tables:', available)
    }
    
    checkTables()
  }, [nhost])
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Available GraphQL Tables</h1>
      <ul className="space-y-2">
        {tables.map(table => (
          <li key={table} className="p-2 bg-gray-100 rounded">
            ✅ {table}
          </li>
        ))}
      </ul>
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
        <p className="text-yellow-800">
          If "boards" isn't in this list, it's not exposed to GraphQL yet.
        </p>
      </div>
    </div>
  )
}