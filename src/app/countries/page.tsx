'use client'

import { gql } from '@apollo/client'
import { useQuery } from '@apollo/client/react'

const GET_COUNTRIES = gql`
  query GetCountries {
    countries {
      code
      name
    }
  }
`

// Define TypeScript interfaces
interface Country {
  code: string
  name: string
}

interface CountriesData {
  countries: Country[]
}

export default function CountriesPage() {
  const { data, loading, error } = useQuery<CountriesData>(GET_COUNTRIES)

  if (loading) return <p className="p-6">Loading…</p>
  if (error) return <p className="p-6 text-red-500">Error: {error.message}</p>

  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Countries</h1>
      <ul className="list-disc pl-6 space-y-1">
        {data?.countries?.map((c) => (
          <li key={c.code}>{c.name}</li>
        ))}
      </ul>
    </main>
  )
}