import { useActiveEditor } from '@/lib/editorStore'
import { useVoiceInput } from '@/hooks/useVoiceInput'
import { EditorToolbar } from '@/components/EditorToolbar'
import { RecordingBar } from '@/components/editor/RecordingBar'

export function EditorToolbarContainer() {
  const editor = useActiveEditor()

  const { isRecording, isSupported, toggle: toggleVoice } = useVoiceInput((text) => {
    editor?.commands.insertContent(text + ' ')
  })

  if (!editor) return null

  return (
    <div className="border-t border-border bg-background p-1">
      <EditorToolbar
        editor={editor}
        isRecording={isRecording}
        isSupported={isSupported}
        onVoiceToggle={toggleVoice}
      />
      <RecordingBar isRecording={isRecording} onStop={toggleVoice} />
    </div>
  )
}
