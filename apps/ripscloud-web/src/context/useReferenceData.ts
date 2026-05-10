import { useCallback, useContext, useEffect, useState } from 'react'

import { ReferenceDataContext } from './referenceDataContext.shared'
import type { ReferenceTableName, ReferenceTableRecordMap } from '@/lib/reference-data/types'
import { getTableRecords as readTableRecords } from '@/lib/reference-data/storage'

export const useReferenceData = () => {
  const context = useContext(ReferenceDataContext)
  if (!context) {
    throw new Error('useReferenceData must be used within ReferenceDataProvider')
  }
  return context
}

interface UseReferenceTableRecordsOptions {
  enabled?: boolean
}

export const useReferenceTableRecords = <TTable extends ReferenceTableName>(
  table: TTable,
  options?: UseReferenceTableRecordsOptions,
) => {
  const { metadata } = useReferenceData()
  const enabled = options?.enabled ?? true
  const [records, setRecords] = useState<ReferenceTableRecordMap[TTable][]>([])
  const [loading, setLoading] = useState(enabled)
  const [error, setError] = useState<string | null>(null)

  const loadRecords = useCallback(async () => {
    if (!enabled) {
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data = await readTableRecords<ReferenceTableRecordMap[TTable]>(table)
      setRecords(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }, [enabled, table])

  useEffect(() => {
    if (!enabled) {
      setRecords([])
      setLoading(false)
      setError(null)
      return
    }
    void loadRecords()
  }, [enabled, loadRecords])

  const checksum = metadata[table]?.checksum

  useEffect(() => {
    if (!checksum || !enabled) {
      return
    }
    void loadRecords()
  }, [checksum, enabled, loadRecords])

  return { records, loading, error }
}
