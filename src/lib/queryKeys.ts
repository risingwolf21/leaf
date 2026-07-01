export const notesKeys = {
  all: (userId?: string) => ['notes', userId] as const,
  folder: (folderId: string) => ['notes', folderId] as const,
  trash: (userId?: string) => ['notes', userId, 'trash'] as const,
}

export const foldersKeys = {
  all: (userId?: string) => ['folders', userId] as const,
}

export const tagsKeys = {
  all: (userId?: string) => ['tags', userId] as const,
}

export const templatesKeys = {
  all: (userId?: string) => ['templates', userId] as const,
}

export const sharedNotesKeys = {
  all: (userId?: string) => ['shared-notes', userId] as const,
}
