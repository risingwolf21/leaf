import { Image } from '@tiptap/extension-image'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import type { EditorView } from '@tiptap/pm/view'
import { toast } from '@/hooks/use-toast'
import { uploadNoteImage, validateImageFile } from '@/lib/image-upload'

interface UploadMeta {
  add?: { id: object; pos: number }
  remove?: { id: object }
}

export const imageUploadPluginKey = new PluginKey<DecorationSet>('imageUploadPlaceholder')

function findPlaceholderPos(view: EditorView, id: object): number | null {
  const decorations = imageUploadPluginKey.getState(view.state)
  const found = decorations?.find(undefined, undefined, (spec) => spec.id === id)
  return found && found.length > 0 ? found[0].from : null
}

function createPlaceholder() {
  const wrapper = document.createElement('span')
  wrapper.className =
    'my-1 inline-flex items-center gap-2 rounded-lg border border-border bg-muted px-3 py-1.5 align-middle text-sm text-muted-foreground'

  const spinner = document.createElement('span')
  spinner.className = 'h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent'
  wrapper.appendChild(spinner)

  const label = document.createElement('span')
  label.textContent = 'Uploading image…'
  wrapper.appendChild(label)

  return wrapper
}

function getImageFiles(fileList: FileList | null | undefined): File[] {
  if (!fileList) return []
  return Array.from(fileList).filter((file) => file.type.startsWith('image/'))
}

/** Uploads `file`, showing a placeholder at `pos` until it resolves into an inserted image node. */
export function uploadImageAt(view: EditorView, file: File, pos: number) {
  const validationError = validateImageFile(file)
  if (validationError) {
    toast({ title: 'Cannot upload image', description: validationError, variant: 'destructive' })
    return
  }

  const id = {}
  view.dispatch(view.state.tr.setMeta(imageUploadPluginKey, { add: { id, pos } } satisfies UploadMeta))

  uploadNoteImage(file)
    .then((src) => {
      const placeholderPos = findPlaceholderPos(view, id)
      let tr = view.state.tr.setMeta(imageUploadPluginKey, { remove: { id } } satisfies UploadMeta)
      if (placeholderPos != null) {
        tr = tr.replaceWith(placeholderPos, placeholderPos, view.state.schema.nodes.image.create({ src, alt: file.name }))
      }
      view.dispatch(tr)
    })
    .catch((error: unknown) => {
      view.dispatch(view.state.tr.setMeta(imageUploadPluginKey, { remove: { id } } satisfies UploadMeta))
      toast({
        title: 'Image upload failed',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      })
    })
}

/**
 * Extends the standard Image node with paste/drop-to-upload support. Dropped or pasted
 * image files are uploaded to Supabase Storage and shown as a loading placeholder until
 * the resulting image node is inserted.
 */
export const ImageUpload = Image.extend({
  addProseMirrorPlugins() {
    return [
      ...(this.parent?.() ?? []),
      new Plugin({
        key: imageUploadPluginKey,
        state: {
          init: () => DecorationSet.empty,
          apply(tr, set) {
            set = set.map(tr.mapping, tr.doc)

            const meta = tr.getMeta(imageUploadPluginKey) as UploadMeta | undefined
            if (meta?.add) {
              set = set.add(tr.doc, [Decoration.widget(meta.add.pos, createPlaceholder(), { id: meta.add.id })])
            } else if (meta?.remove) {
              set = set.remove(set.find(undefined, undefined, (spec) => spec.id === meta.remove?.id))
            }

            return set
          },
        },
        props: {
          decorations(state) {
            return imageUploadPluginKey.getState(state)
          },
          handleDrop(view, event, _slice, moved) {
            if (moved) return false

            const files = getImageFiles(event.dataTransfer?.files)
            if (files.length === 0) return false

            event.preventDefault()
            const coords = view.posAtCoords({ left: event.clientX, top: event.clientY })
            const pos = coords?.pos ?? view.state.selection.from
            files.forEach((file) => uploadImageAt(view, file, pos))
            return true
          },
          handlePaste(view, event) {
            const files = getImageFiles(event.clipboardData?.files)
            if (files.length === 0) return false

            event.preventDefault()
            files.forEach((file) => uploadImageAt(view, file, view.state.selection.from))
            return true
          },
        },
      }),
    ]
  },
})
