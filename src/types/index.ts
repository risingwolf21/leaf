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
}

export interface NoteVersion {
  id: string
  note_id: string
  user_id: string
  content: string
  title: string
  saved_at: string
}

export interface NoteLink {
  id: string
  note_id: string
  user_id: string
  display_text: string
  url: string
  show_preview: boolean
  og_title: string | null
  og_description: string | null
  og_image: string | null
  og_fetched_at: string | null
  created_at: string
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
