import type { Note, SortBy } from '@/types'

function byUpdatedAtDesc<T extends Note>(a: T, b: T) {
  return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
}

/** Sorts notes by `deleted_at desc`, for the trash view. */
export function sortByDeletedAtDesc(notes: Note[]) {
  return [...notes].sort(
    (a, b) => new Date(b.deleted_at ?? 0).getTime() - new Date(a.deleted_at ?? 0).getTime()
  )
}

/** Pinned notes always come first (sorted by `updated_at desc`); the rest follow `sortBy`. */
export function sortNotes<T extends Note>(notes: T[], sortBy: SortBy): T[] {
  const pinned = notes.filter((note) => note.pinned).sort(byUpdatedAtDesc)
  const rest = notes.filter((note) => !note.pinned)

  switch (sortBy) {
    case 'created_at':
      rest.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      break
    case 'title_asc':
      rest.sort((a, b) => a.title.localeCompare(b.title))
      break
    case 'title_desc':
      rest.sort((a, b) => b.title.localeCompare(a.title))
      break
    case 'updated_at':
    default:
      rest.sort(byUpdatedAtDesc)
  }

  return [...pinned, ...rest]
}
