// app/providers.tsx
'use client'

import { PropsWithChildren } from 'react'
import { NhostProvider } from '@nhost/nextjs'
import { nhost } from '@/lib/nhost'
import { ApolloProvider, ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client'
import { setContext } from '@apollo/client/link/context'

const subdomain = process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN || 'localhost'

const httpLink = createHttpLink({
  uri: `https://${subdomain}.nhost.run/v1/graphql`,
})

const authLink = setContext((_, { headers }) => {
  const token = nhost.auth.getAccessToken()
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  }
})

const apolloClient = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
})

export default function Providers({ children }: PropsWithChildren) {
  return (
    <NhostProvider nhost={nhost}>
      <ApolloProvider client={apolloClient}>
        {children}
      </ApolloProvider>
    </NhostProvider>
  )
}