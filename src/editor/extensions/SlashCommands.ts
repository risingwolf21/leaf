import { Extension } from '@tiptap/core'
import { Suggestion } from '@tiptap/suggestion'
import { PluginKey } from '@tiptap/pm/state'
import { toast } from 'sonner'
import { filterSlashCommands } from './slashCommandItems'
import { createMenuRenderer } from './slashCommandsRenderer'

const slashCommandsKey = new PluginKey('slashCommands')

export const SlashCommands = Extension.create({
  name: 'slashCommands',

  addProseMirrorPlugins() {
    const { editor } = this

    return [
      Suggestion({
        editor,
        pluginKey: slashCommandsKey,
        char: '/',
        allowSpaces: false,
        startOfLine: false,
        items: ({ query }) => filterSlashCommands(query),
        command: ({ editor: commandEditor, range, props }) => {
          if (props.id === 'toc') {
            // Only one ToC is allowed per note to avoid redundant outlines
            let hasToc = false
            commandEditor.state.doc.forEach((node) => {
              if (node.type.name === 'tableOfContents') hasToc = true
            })

            if (hasToc) {
              toast.info('A table of contents already exists in this note.')
              // Still delete the trigger text so the user is not left with "/toc"
              commandEditor.chain().focus().deleteRange(range).run()
              return
            }

            commandEditor
              .chain()
              .focus()
              .deleteRange(range)
              .insertContent({ type: 'tableOfContents' })
              .run()
          }
        },
        render: createMenuRenderer,
      }),
    ]
  },
})
