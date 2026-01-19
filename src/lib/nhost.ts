// lib/nhost.ts
'use client'

import { NhostClient } from '@nhost/nhost-js'

const subdomain = process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN || 'localhost'
const region = process.env.NEXT_PUBLIC_NHOST_REGION || 'us-east-1'

console.log('Nhost config:', { subdomain, region })

export const nhost = new NhostClient({
  subdomain,
  region,
  // These are important for v3
  start: true,
  autoSignIn: true,
  autoRefreshToken: true,
})