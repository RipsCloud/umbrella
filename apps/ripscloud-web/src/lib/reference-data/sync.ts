import type { ReferenceTableDefinition, ReferenceTableMetadata, ReferenceTableName } from './types'
import { getTableMetadata, replaceTableRecords, saveTableMetadata } from './storage'
import type { ReferenceTableRecordMap, ReferenceTableSourceMap } from './types'

const computeChecksum = (records: unknown[]): string => {
  const serialized = JSON.stringify(records)
  let hash = 0

  for (let index = 0; index < serialized.length; index += 1) {
    const charCode = serialized.charCodeAt(index)
    hash = (hash << 5) - hash + charCode
    hash |= 0
  }

  return hash.toString(16)
}

export interface ReferenceTableSyncResult<TTable extends ReferenceTableName> {
  table: TTable
  updated: boolean
  metadata: ReferenceTableMetadata
}

export const syncReferenceTable = async <TTable extends ReferenceTableName>(
  definition: ReferenceTableDefinition<TTable>,
): Promise<ReferenceTableSyncResult<TTable>> => {
  const existingMetadata = await getTableMetadata(definition.table)

  // If we have a stored etag and the local transformer version hasn't
  // changed, send If-None-Match. The CDN (cdn-minsalud.pahventure.com)
  // returns 304 with no body when nothing's changed — we skip the parse,
  // the transform, the checksum, and the IDB write.
  const headers: HeadersInit = {}
  if (
    existingMetadata?.etag &&
    existingMetadata.version === definition.version
  ) {
    headers['If-None-Match'] = existingMetadata.etag
  }

  const response = await fetch(definition.sourceUrl, { headers })

  if (response.status === 304) {
    // No changes — just bump lastSyncedAt and return.
    if (!existingMetadata) {
      // Defensive: a 304 without prior metadata shouldn't happen, but if it
      // does we treat it as a soft error and force a full re-fetch next time.
      throw new Error(`304 Not Modified for ${definition.table} but no local metadata exists`)
    }
    const refreshed: ReferenceTableMetadata = {
      ...existingMetadata,
      lastSyncedAt: Date.now(),
    }
    await saveTableMetadata(refreshed)
    return { table: definition.table, updated: false, metadata: refreshed }
  }

  if (!response.ok) {
    throw new Error(`Failed to load reference table ${definition.table} (HTTP ${response.status})`)
  }

  const responseEtag = response.headers.get('etag')

  const payload = (await response.json()) as ReferenceTableSourceMap[TTable][]
  const mappedRecords = payload
    .map((record) => definition.transform(record))
    .filter((record): record is ReferenceTableRecordMap[TTable] => Boolean(record))

  const checksum = computeChecksum(mappedRecords)

  // Body-checksum dedupe (IDB-level) — useful when the CDN doesn't send an
  // etag, when the etag changed but the parsed/transformed shape didn't,
  // or on the very first sync (no prior etag yet).
  if (
    existingMetadata &&
    existingMetadata.version === definition.version &&
    existingMetadata.checksum === checksum
  ) {
    const refreshed: ReferenceTableMetadata = {
      ...existingMetadata,
      lastSyncedAt: Date.now(),
      etag: responseEtag ?? existingMetadata.etag ?? null,
    }
    await saveTableMetadata(refreshed)
    return { table: definition.table, updated: false, metadata: refreshed }
  }

  await replaceTableRecords(definition.table, definition.primaryKey, mappedRecords)

  const metadata: ReferenceTableMetadata = {
    table: definition.table,
    version: definition.version,
    checksum,
    recordCount: mappedRecords.length,
    lastSyncedAt: Date.now(),
    etag: responseEtag,
  }

  await saveTableMetadata(metadata)
  return { table: definition.table, updated: true, metadata }
}
