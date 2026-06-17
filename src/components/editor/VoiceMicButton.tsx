import { Mic, MicOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Toggle } from '@/components/ui/toggle'

type VoiceMicButtonProps = {
  isRecording: boolean
  isSupported: boolean
  onToggle: () => void
}

export function VoiceMicButton({ isRecording, isSupported, onToggle }: VoiceMicButtonProps) {
  if (!isSupported) {
    return (
      <Toggle
        size="sm"
        disabled
        aria-label="Voice input"
        title="Voice input is not supported in this browser"
      >
        <Mic className="h-5 w-5 text-muted-foreground/50" />
      </Toggle>
    )
  }

  return (
    <Toggle
      size="sm"
      pressed={isRecording}
      onPressedChange={onToggle}
      aria-label={isRecording ? 'Stop recording' : 'Start voice input'}
      className={cn(isRecording && 'text-red-500 animate-pulse')}
    >
      {isRecording ? (
        <MicOff className="h-5 w-5" />
      ) : (
        <Mic className={cn('h-5 w-5', 'text-muted-foreground')} />
      )}
    </Toggle>
  )
}
