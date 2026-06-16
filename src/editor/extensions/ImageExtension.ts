import { ReactNodeViewRenderer } from '@tiptap/react'
import { Plugin } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import {
  imageUploadPluginKey,
  uploadImageAt,
  getImageFiles,
  createUploadPlaceholder,
} from '@/editor/extensions/ImageUpload'
import { ImageWithResize } from '@/editor/extensions/Image'
import { ImageView } from '@/components/editor/ImageView'

// Combines all image capabilities into a single TipTap extension.
// ProseMirror only allows one registered extension per node name so
// width/resize, file paste/drop upload, and the NodeView all live here.
export const ImageExtension = ImageWithResize.extend({
  addNodeView() {
    return ReactNodeViewRenderer(ImageView)
  },

  addProseMirrorPlugins() {
    return [
      ...(this.parent?.() ?? []),
      new Plugin({
        key: imageUploadPluginKey,
        state: {
          init: () => DecorationSet.empty,
          apply(tr, set) {
            set = set.map(tr.mapping, tr.doc)

            // ProseMirror's Transaction.getMeta returns `any`.
            const meta = tr.getMeta(imageUploadPluginKey) as
              | { add?: { id: object; pos: number }; remove?: { id: object } }
              | undefined
            if (meta?.add) {
              set = set.add(tr.doc, [
                Decoration.widget(meta.add.pos, createUploadPlaceholder(), { id: meta.add.id }),
              ])
            } else if (meta?.remove) {
              set = set.remove(
                set.find(undefined, undefined, (spec) => spec.id === meta.remove?.id),
              )
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
