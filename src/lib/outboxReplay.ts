import type { QueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { notesKeys } from '@/lib/queryKeys'
import { getAllPending, dequeue } from '@/lib/outbox'
import type { OutboxEntry } from '@/lib/outbox'
import type { Conflict } from '@/lib/conflictStore'
import type { Note, NoteWithTags } from '@/types'

type AddConflict = (c: Conflict) => void

async function replayUpdate(
  entry: Extract<OutboxEntry, { type: 'update' }>,
  userId: string,
  queryClient: QueryClient,
  addConflict: AddConflict,
): Promise<void> {
  const { data: serverNote } = await supabase
    .from('notes')
    .select('id, title, content, updated_at')
    .eq('id', entry.noteId)
    .single()

  if (!serverNote) {
    // Note no longer exists on server — discard.
    await dequeue(entry.id)
    return
  }

  // Conflict: server was modified after we queued locally.
  if (serverNote.updated_at > entry.queuedAt) {
    const notes = queryClient.getQueryData<NoteWithTags[]>(notesKeys.all(userId)) ?? []
    const cached = notes.find((n) => n.id === entry.noteId)
    addConflict({
      noteId: entry.noteId,
      noteTitle: cached?.title ?? (serverNote.title as string),
      localVersion: entry.fields,
      serverVersion: {
        title: serverNote.title as string,
        content: serverNote.content as string,
        updated_at: serverNote.updated_at as string,
      },
      queuedAt: entry.queuedAt,
    })
    await dequeue(entry.id)
    return
  }

  await supabase.from('notes').update(entry.fields).eq('id', entry.noteId)
  await dequeue(entry.id)
  await queryClient.invalidateQueries({ queryKey: notesKeys.all(userId) })
}

async function replayCreate(
  entry: Extract<OutboxEntry, { type: 'create' }>,
  userId: string,
  queryClient: QueryClient,
): Promise<void> {
  const { data, error } = await supabase
    .from('notes')
    .insert({ ...entry.note, user_id: userId })
    .select()
    .single()

  if (error || !data) return

  // Replace the temp-id optimistic entry in cache with the server note.
  // Supabase returns `any` for untyped tables, cast with comment.
  queryClient.setQueryData<NoteWithTags[]>(notesKeys.all(userId), (prev = []) =>
    prev.map((n) =>
      n.id === entry.tempId
        ? { ...(data as Note), title: entry.note.title, content: entry.note.content, tags: [] }
        : n
    )
  )

  await dequeue(entry.id)
}

async function replayDelete(
  entry: Extract<OutboxEntry, { type: 'delete' }>,
  userId: string,
  queryClient: QueryClient,
): Promise<void> {
  await supabase.from('notes').update({ deleted_at: new Date().toISOString() }).eq('id', entry.noteId)
  await dequeue(entry.id)
  await queryClient.invalidateQueries({ queryKey: notesKeys.all(userId) })
}

export async function replayOutbox(
  userId: string,
  queryClient: QueryClient,
  addConflict: AddConflict,
): Promise<void> {
  const pending = await getAllPending()

  for (const entry of pending) {
    if (entry.type === 'update') {
      await replayUpdate(entry, userId, queryClient, addConflict)
    } else if (entry.type === 'create') {
      await replayCreate(entry, userId, queryClient)
    } else {
      await replayDelete(entry, userId, queryClient)
    }
  }
}
