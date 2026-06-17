import { Extension } from '@tiptap/core'
import { Plugin } from '@tiptap/pm/state'

/**
 * TaskItem's `onReadOnlyChecked` option only receives `(node, checked)` —
 * no position — so it can't persist the toggle itself, and the node it
 * receives goes stale after the first edit (node views aren't recreated on
 * attr-only updates). This plugin re-resolves the position fresh from the
 * DOM on every click instead, so repeated toggles of the same checkbox
 * keep working. It runs after the node view's own `change` listener (which
 * `onReadOnlyChecked: () => true` stops from reverting the checkbox), so
 * `target.checked` still reflects the user's click.
 */
export const ReadOnlyTaskItem = Extension.create({
  name: 'readOnlyTaskItem',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        props: {
          handleDOMEvents: {
            change(view, event) {
              if (view.editable) return false

              const target = event.target
              if (!(target instanceof HTMLInputElement) || target.type !== 'checkbox') return false

              // TaskItem's node view never sets data-type on its <li> (that's only
              // in its renderHTML spec, bypassed by the custom node view) — the
              // depth-walk below is what actually confirms this is a taskItem.
              const listItem = target.closest<HTMLElement>('li')
              if (!listItem) return false

              const resolvedPos = view.state.doc.resolve(view.posAtDOM(listItem, 0))

              let taskItemDepth = -1
              for (let depth = resolvedPos.depth; depth >= 0; depth--) {
                if (resolvedPos.node(depth).type.name === 'taskItem') {
                  taskItemDepth = depth
                  break
                }
              }
              if (taskItemDepth === -1) return false

              const taskItemPos = resolvedPos.before(taskItemDepth)
              const taskItemNode = resolvedPos.node(taskItemDepth)

              view.dispatch(
                view.state.tr.setNodeMarkup(taskItemPos, undefined, {
                  ...taskItemNode.attrs,
                  checked: target.checked,
                })
              )
              return true
            },
          },
        },
      }),
    ]
  },
})
