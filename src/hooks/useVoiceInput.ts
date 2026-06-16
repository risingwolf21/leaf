declare global {
  interface SpeechRecognition extends EventTarget {
    continuous: boolean
    interimResults: boolean
    lang: string
    onresult: ((event: SpeechRecognitionEvent) => void) | null
    onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
    onend: (() => void) | null
    start(): void
    stop(): void
  }

  interface SpeechRecognitionEvent extends Event {
    readonly resultIndex: number
    readonly results: SpeechRecognitionResultList
  }

  interface SpeechRecognitionErrorEvent extends Event {
    readonly error: string
  }

  interface SpeechRecognitionConstructor {
    new (): SpeechRecognition
  }

  interface Window {
    SpeechRecognition: SpeechRecognitionConstructor
    webkitSpeechRecognition: SpeechRecognitionConstructor
  }
}

import { useCallback, useRef, useState } from 'react'
import { toast } from 'sonner'

export function useVoiceInput(onTranscript: (text: string) => void) {
  const [isRecording, setIsRecording] = useState(false)
  const [isSupported] = useState(
    () => 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
  )
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  const start = useCallback(() => {
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition
    const recognition = new SR()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = navigator.language

    let accumulated = ''

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          accumulated += event.results[i][0].transcript
        }
      }
      if (accumulated) {
        onTranscript(accumulated)
        accumulated = ''
      }
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'not-allowed') {
        toast.error('Microphone access denied. Enable it in your browser settings.')
      }
      setIsRecording(false)
    }

    recognition.onend = () => setIsRecording(false)
    recognition.start()
    recognitionRef.current = recognition
    setIsRecording(true)
  }, [onTranscript])

  const stop = useCallback(() => {
    recognitionRef.current?.stop()
    setIsRecording(false)
  }, [])

  const toggle = useCallback(() => {
    if (isRecording) stop()
    else start()
  }, [isRecording, start, stop])

  return { isRecording, isSupported, toggle }
}
