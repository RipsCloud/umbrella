import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { ReferenceTableMetadata, ReferenceTableName } from './types'

const DB_NAME = 'ripsAdminReferenceData'
const DB_VERSION = 1
const RECORD_STORE = 'reference-records'
const METADATA_STORE = 'reference-metadata'
const TABLE_INDEX = 'by-table'

interface ReferenceRecordValue {
  __pk: string
  table: ReferenceTableName
  key: string
  data: unknown
  syncedAt: number
}

interface ReferenceDatabaseSchema extends DBSchema {
  [RECORD_STORE]: {
    key: string
    value: ReferenceRecordValue
    indexes: { [TABLE_INDEX]: ReferenceTableName }
  }
  [METADATA_STORE]: {
    key: ReferenceTableName
    value: ReferenceTableMetadata
  }
}

let dbPromise: Promise<IDBPDatabase<ReferenceDatabaseSchema>> | null = null

const getDb = () => {
  if (!dbPromise) {
    dbPromise = openDB<ReferenceDatabaseSchema>(DB_NAME, DB_VERSION, {
      upgrade(database) {
        if (!database.objectStoreNames.contains(RECORD_STORE)) {
          const recordStore = database.createObjectStore(RECORD_STORE, { keyPath: '__pk' })
          recordStore.createIndex(TABLE_INDEX, 'table')
        }

        if (!database.objectStoreNames.contains(METADATA_STORE)) {
          database.createObjectStore(METADATA_STORE, { keyPath: 'table' })
        }
      },
    })
  }

  return dbPromise
}

export const replaceTableRecords = async <T>(
  table: ReferenceTableName,
  primaryKey: keyof T & string,
  records: T[],
) => {
  const db = await getDb()
  const tx = db.transaction(RECORD_STORE, 'readwrite')
  const store = tx.objectStore(RECORD_STORE)
  const index = store.index(TABLE_INDEX)
  let cursor = await index.openCursor(table)

  while (cursor) {
    await cursor.delete()
    cursor = await cursor.continue()
  }

  const timestamp = Date.now()

  for (const record of records) {
    const primaryValue = (record as Record<string, unknown>)[primaryKey]
    if (primaryValue === undefined || primaryValue === null) {
      continue
    }

    const key = String(primaryValue)
    await store.put({
      __pk: `${table}:${key}`,
      table,
      key,
      data: record,
      syncedAt: timestamp,
    })
  }

  await tx.done
}

export const getTableRecords = async <T>(table: ReferenceTableName): Promise<T[]> => {
  const db = await getDb()
  const tx = db.transaction(RECORD_STORE, 'readonly')
  const store = tx.objectStore(RECORD_STORE)
  const index = store.index(TABLE_INDEX)
  const results: T[] = []

  let cursor = await index.openCursor(table)
  while (cursor) {
    results.push(cursor.value.data as T)
    cursor = await cursor.continue()
  }

  await tx.done
  return results
}

export const getTableMetadata = async (
  table: ReferenceTableName,
): Promise<ReferenceTableMetadata | undefined> => {
  const db = await getDb()
  return db.get(METADATA_STORE, table)
}

export const saveTableMetadata = async (metadata: ReferenceTableMetadata) => {
  const db = await getDb()
  await db.put(METADATA_STORE, metadata)
}
