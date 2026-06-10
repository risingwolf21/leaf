export interface Note {
  id: string
  user_id: string
  title: string
  content: string
  folder_id: string | null
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export interface Folder {
  id: string
  user_id: string
  name: string
  created_at: string
}

export interface AuthFormData {
  email: string
  password: string
}

export type ViewMode = 'preview' | 'edit' | 'source'
