// lib/nhost.ts
'use client'

import { NhostClient } from '@nhost/nhost-js'

export const nhost = new NhostClient({
  subdomain: process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN || 'localhost',
  region: process.env.NEXT_PUBLIC_NHOST_REGION || 'local',
  
  // Minimum required configuration
  autoSignIn: true,
  autoRefreshToken: true,
  
  // Set up GraphQL endpoint
  graphql: {
    endpoint: `https://${process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN || 'localhost'}.nhost.run/v1/graphql`
  }
})