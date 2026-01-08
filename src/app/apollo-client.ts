'use client'

import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client'

const client = new ApolloClient({
  link: new HttpLink({
    uri: process.env.NEXT_PUBLIC_GRAPHQL_URL || 'https://swapi-graphql.netlify.app/.netlify/functions/index',
  }),
  cache: new InMemoryCache(),
})

export default client