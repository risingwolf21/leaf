import { useRef, useState } from 'react'
import type { Editor } from '@tiptap/react'
import { toast } from 'sonner'
import { VoiceMicButton } from '@/components/editor/VoiceMicButton'
import { VoiceRecordingDialog } from '@/components/editor/VoiceRecordingDialog'
import { useVoiceInput } from '@/hooks/useVoiceInput'

type VoiceInputControlProps = {
  editor: Editor
}

type CapturedSelection = { from: number; to: number }

/**
 * The mic button steals DOM focus on click, which drops the editor's visible
 * cursor. We capture the selection before that happens so "Insert" can
 * restore it later, regardless of what focus did in between.
 */
export function VoiceInputControl({ editor }: VoiceInputControlProps) {
  const { isRecording, isSupported, transcript, toggle, stop, reset } = useVoiceInput()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const capturedSelectionRef = useRef<CapturedSelection | null>(null)

  const handleToggle = () => {
    if (!isRecording) {
      capturedSelectionRef.current = { from: editor.state.selection.from, to: editor.state.selection.to }
      setIsDialogOpen(true)
    }
    toggle()
  }

  const handleClose = () => {
    if (isRecording) stop()
    setIsDialogOpen(false)
    reset()
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(transcript.trim())
    toast.success('Copied to clipboard')
    handleClose()
  }

  const handleInsert = () => {
    const docSize = editor.state.doc.content.size
    const selection = capturedSelectionRef.current
    const chain = editor.chain().focus()
    if (selection) {
      chain.setTextSelection({ from: Math.min(selection.from, docSize), to: Math.min(selection.to, docSize) })
    }
    chain.insertContent(`${transcript.trim()} `).run()
    handleClose()
  }

  return (
    <>
      <VoiceMicButton isRecording={isRecording} isSupported={isSupported} onToggle={handleToggle} />
      <VoiceRecordingDialog
        open={isDialogOpen}
        isRecording={isRecording}
        transcript={transcript}
        onOpenChange={(open) => !open && handleClose()}
        onStop={stop}
        onCopy={handleCopy}
        onInsert={handleInsert}
      />
    </>
  )
}
