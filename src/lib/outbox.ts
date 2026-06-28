import { openDB } from 'idb'
import type { Note } from '@/types'

export type OutboxOperation =
  | { type: 'update'; noteId: string; fields: Partial<Note>; queuedAt: string }
  | { type: 'create'; note: Omit<Note, 'id' | 'created_at' | 'updated_at'>; tempId: string; queuedAt: string }
  | { type: 'delete'; noteId: string; queuedAt: string }

export type OutboxEntry = OutboxOperation & { id: number }

const DB_NAME = 'leaf-outbox'
const STORE = 'operations'

const dbPromise = openDB(DB_NAME, 1, {
  upgrade(db) {
    db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true })
  },
})

export async function enqueue(op: OutboxOperation): Promise<void> {
  const db = await dbPromise
  await db.add(STORE, op)
}

export async function dequeue(id: number): Promise<void> {
  const db = await dbPromise
  await db.delete(STORE, id)
}

export async function getAllPending(): Promise<OutboxEntry[]> {
  const db = await dbPromise
  return db.getAll(STORE) as Promise<OutboxEntry[]>
}
