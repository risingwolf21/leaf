import type { BuiltinTemplate } from '@/lib/templates'

export type ShareRole = 'viewer' | 'editor'

export type Note = {
  id: string
  user_id: string
  title: string
  content: string
  folder_id: string | null
  pinned: boolean
  deleted_at: string | null
  created_at: string
  updated_at: string
  share_token: string | null
  shared_at: string | null
  share_link_role: ShareRole
}

export type Profile = {
  id: string
  email: string
}

export type NoteCollaborator = {
  id: string
  note_id: string
  owner_id: string
  user_id: string
  role: ShareRole
  created_at: string
  email: string
}

/** A note shared with the current user, for the "Shared with me" sidebar section. */
export type SharedNote = Note & {
  owner_email: string
  my_role: ShareRole
  shared_since: string
}

export type NoteVersion = {
  id: string
  note_id: string
  user_id: string
  content: string
  title: string
  saved_at: string
}

export type Folder = {
  id: string
  user_id: string
  name: string
  parent_id: string | null
  created_at: string
}

export type Tag = {
  id: string
  user_id: string
  name: string
  color: string
  created_at: string
  /** Number of non-trashed notes with this tag, present when fetched via `get_tags_with_counts`. */
  note_count?: number
}

export type NoteWithTags = Note & {
  tags: Tag[]
}

export type NoteFields = Partial<Pick<Note, 'title' | 'content' | 'share_link_role'>>

export type SortBy = 'updated_at' | 'created_at' | 'title_asc' | 'title_desc'

export type ViewMode = 'preview' | 'edit' | 'source' | 'split'

export type AuthFormData = {
  email: string
  password: string
}

export type Template = {
  id: string
  user_id: string
  name: string
  content: string
  created_at: string
}

/** Union used by the template picker UI to handle built-in and custom templates uniformly. */
export type AnyTemplate =
  | { type: 'builtin'; template: BuiltinTemplate }
  | { type: 'custom'; template: Template }
