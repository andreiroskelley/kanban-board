// app/providers.tsx
'use client'

import { PropsWithChildren } from 'react'
import { NhostProvider } from '@nhost/nextjs'
import { nhost } from '@/lib/nhost'

export default function Providers({ children }: PropsWithChildren) {
  return (
    <NhostProvider nhost={nhost}>
      {children}
    </NhostProvider>
  )
}