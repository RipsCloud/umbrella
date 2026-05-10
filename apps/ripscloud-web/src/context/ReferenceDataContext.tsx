import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'

import { referenceTableList } from '@/lib/reference-data/referenceTables'
import type { ReferenceTableDefinition, ReferenceTableName } from '@/lib/reference-data/types'
import { syncReferenceTable } from '@/lib/reference-data/sync'
import {
  ReferenceDataContext,
  type ReferenceDataContextValue,
  type ReferenceSyncStatus,
} from './referenceDataContext.shared'

export function ReferenceDataProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<ReferenceSyncStatus>('idle')
  const [progress, setProgress] = useState(0)
  const [activeTable, setActiveTable] = useState<ReferenceDataContextValue['activeTable']>(undefined)
  const [metadata, setMetadata] = useState<ReferenceDataContextValue['metadata']>({})
  const [errors, setErrors] = useState<ReferenceDataContextValue['errors']>({})
  const bootstrapRef = useRef(false)
  const syncingRef = useRef<Promise<void> | null>(null)
  const tablesRef = useRef(referenceTableList)

  const syncAll = useCallback(async () => {
    if (syncingRef.current) {
      return syncingRef.current
    }

    const run = (async () => {
      setStatus('syncing')
      setProgress(0)
      setErrors({})
      let encounteredError = false
      const tables = tablesRef.current

      for (let index = 0; index < tables.length; index += 1) {
        const definition = tables[index]
        setActiveTable(definition.table)

        try {
          const result = await syncReferenceTable(
            definition as ReferenceTableDefinition<ReferenceTableName>,
          )
          setMetadata((prev) => ({ ...prev, [definition.table]: result.metadata }))
        } catch (error) {
          encounteredError = true
          console.error(`Failed to sync ${definition.table}`, error)
          setErrors((prev) => ({
            ...prev,
            [definition.table]: error instanceof Error ? error.message : String(error),
          }))
        }

        setProgress((index + 1) / tables.length)
      }

      setActiveTable(undefined)
      setStatus(encounteredError ? 'error' : 'ready')
      syncingRef.current = null
    })()

    syncingRef.current = run
    return run
  }, [])

  useEffect(() => {
    if (bootstrapRef.current) {
      return
    }
    bootstrapRef.current = true
    void syncAll()
  }, [syncAll])

  const triggerSync = useCallback(() => syncAll(), [syncAll])

  const value = useMemo<ReferenceDataContextValue>(
    () => ({
      status,
      progress,
      activeTable,
      metadata,
      errors,
      triggerSync,
    }),
    [status, progress, activeTable, metadata, errors, triggerSync],
  )

  return <ReferenceDataContext.Provider value={value}>{children}</ReferenceDataContext.Provider>
}
