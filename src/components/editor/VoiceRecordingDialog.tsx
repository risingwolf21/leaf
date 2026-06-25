import { Mic, Square } from 'lucide-react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type VoiceRecordingDialogProps = {
  open: boolean
  isRecording: boolean
  transcript: string
  onOpenChange: (open: boolean) => void
  onStop: () => void
  onCopy: () => void
  onInsert: () => void
}

/** Shows live recording status and transcript, letting the user copy or insert it without losing the editor's cursor position. */
export function VoiceRecordingDialog({
  open,
  isRecording,
  transcript,
  onOpenChange,
  onStop,
  onCopy,
  onInsert,
}: VoiceRecordingDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isRecording ? (
              <>
                <span className="relative flex h-2.5 w-2.5 shrink-0">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
                </span>
                Recording…
              </>
            ) : (
              <>
                <Mic className="h-4 w-4 text-muted-foreground" />
                Transcript ready
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <p
          className={cn(
            'min-h-20 whitespace-pre-wrap rounded-md border border-border bg-muted/40 p-3 text-sm',
            !transcript && 'text-muted-foreground'
          )}
        >
          {transcript || 'Start speaking…'}
        </p>

        <DialogFooter>
          {isRecording ? (
            <Button onClick={onStop} variant="secondary">
              <Square className="h-4 w-4" />
              Stop
            </Button>
          ) : (
            <>
              <Button onClick={onCopy} variant="outline" disabled={!transcript}>
                Copy
              </Button>
              <Button onClick={onInsert} disabled={!transcript}>
                Insert at cursor
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
