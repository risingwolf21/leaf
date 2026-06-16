import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { foldersKeys, notesKeys } from '@/lib/queryKeys'
import { uploadNoteImage } from '@/lib/image-upload'
import { classifyFiles, replaceImageRefs } from '@/lib/import'
import type { Folder, Note, NoteWithTags } from '@/types'

export type ImportFolderStats = {
  notesCreated: number
  notesFailed: number
  foldersCreated: number
  imagesUploaded: number
  imagesFailed: number
}

const EMPTY_STATS: ImportFolderStats = {
  notesCreated: 0, notesFailed: 0, foldersCreated: 0, imagesUploaded: 0, imagesFailed: 0,
}

export function useImportFolder() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (files: File[]): Promise<ImportFolderStats> => {
      if (!user) throw new Error('Not authenticated')

      const { notes, images, folderNames } = classifyFiles(files)
      if (notes.length === 0) return EMPTY_STATS

      // Resolve folders: re-use existing root-level ones, create missing.
      const { data: existing } = await supabase
        .from('folders')
        .select('id, name, user_id, parent_id, created_at')
        .eq('user_id', user.id)
        .is('parent_id', null)

      const folderIdMap = new Map(((existing ?? []) as Folder[]).map((f) => [f.name, f.id]))
      let foldersCreated = 0

      for (const name of folderNames) {
        if (folderIdMap.has(name)) continue
        const { data } = await supabase
          .from('folders')
          .insert({ user_id: user.id, name, parent_id: null })
          .select('id, name, user_id, parent_id, created_at')
          .single()
        if (!data) continue
        const folder = data as Folder
        folderIdMap.set(name, folder.id)
        queryClient.setQueryData<Folder[]>(foldersKeys.all(user.id), (prev = []) => [...prev, folder])
        foldersCreated++
      }

      // Upload images; build a filename → URL map for reference rewriting.
      const imageUrlMap = new Map<string, string>()
      let imagesUploaded = 0, imagesFailed = 0

      await Promise.allSettled(
        [...images.entries()].map(async ([filename, file]) => {
          try {
            imageUrlMap.set(filename, await uploadNoteImage(file))
            imagesUploaded++
          } catch {
            imagesFailed++
          }
        })
      )

      // Create notes, rewriting any local image paths to uploaded URLs.
      let notesCreated = 0, notesFailed = 0

      await Promise.allSettled(
        notes.map(async ({ file, folderName }) => {
          try {
            const rawContent = await file.text()
            const content = replaceImageRefs(rawContent, imageUrlMap)
            const title = file.name.replace(/\.(md|markdown)$/i, '').trim() || 'Untitled'
            const folder_id = folderName ? (folderIdMap.get(folderName) ?? null) : null

            const { data, error } = await supabase
              .from('notes')
              .insert({ user_id: user.id, title, content, folder_id })
              .select()
              .single()
            if (error || !data) throw error ?? new Error('Insert failed')

            const note: NoteWithTags = { ...(data as Note), title, content, tags: [] }
            queryClient.setQueryData<NoteWithTags[]>(notesKeys.all(user.id), (prev = []) => [note, ...prev])
            notesCreated++
          } catch {
            notesFailed++
          }
        })
      )

      return { notesCreated, notesFailed, foldersCreated, imagesUploaded, imagesFailed }
    },
  })
}
