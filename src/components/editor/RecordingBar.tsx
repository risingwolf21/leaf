import { Button } from '@/components/ui/button'

type RecordingBarProps = {
  isRecording: boolean
  onStop: () => void
}

export function RecordingBar({ isRecording, onStop }: RecordingBarProps) {
  if (!isRecording) return null

  return (
    <div className="flex items-center gap-2 border-b border-border bg-muted/50 px-4 py-1.5 text-sm">
      <span className="text-red-500">●</span>
      <span className="flex-1 text-muted-foreground">Listening...</span>
      <Button type="button" variant="ghost" size="sm" onClick={onStop}>
        Stop
      </Button>
    </div>
  )
}
