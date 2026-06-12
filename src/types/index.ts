import type { BuiltinTemplate } from '@/lib/templates'

export type ShareRole = 'viewer' | 'editor'

export interface Note {
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

export interface Profile {
  id: string
  email: string
}

export interface NoteCollaborator {
  id: string
  note_id: string
  owner_id: string
  user_id: string
  role: ShareRole
  created_at: string
  email: string
}

/** A note shared with the current user, for the "Shared with me" sidebar section. */
export interface SharedNote extends Note {
  owner_email: string
  my_role: ShareRole
  shared_since: string
}

export interface NoteVersion {
  id: string
  note_id: string
  user_id: string
  content: string
  title: string
  saved_at: string
}

export interface Folder {
  id: string
  user_id: string
  name: string
  parent_id: string | null
  created_at: string
}

export interface AuthFormData {
  email: string
  password: string
}

export type ViewMode = 'preview' | 'edit' | 'source'

export interface Template {
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
