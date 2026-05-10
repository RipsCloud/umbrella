import { createContext } from 'react'

import type { ReferenceTableMetadata, ReferenceTableName } from '@/lib/reference-data/types'

export type ReferenceSyncStatus = 'idle' | 'syncing' | 'ready' | 'error'

export interface ReferenceDataContextValue {
  status: ReferenceSyncStatus
  progress: number
  activeTable?: ReferenceTableName
  metadata: Partial<Record<ReferenceTableName, ReferenceTableMetadata>>
  errors: Partial<Record<ReferenceTableName, string | null>>
  triggerSync: () => Promise<void>
}

export const ReferenceDataContext = createContext<ReferenceDataContextValue | null>(null)
