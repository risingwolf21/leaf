import type { KeyboardEvent } from 'react'

const RENAME_INPUT_CLASS =
  'min-w-0 flex-1 rounded border border-input bg-background px-1 py-0.5 text-sm focus:outline-none focus-visible:ring-1 focus-visible:ring-ring'

type RenameInputProps = {
  value: string
  onChange: (value: string) => void
  onCommit: () => void
  onCancel: () => void
  placeholder?: string
}

/** Inline text input for renaming a sidebar folder or note row; commits on blur/Enter, cancels on Escape. */
export function RenameInput({ value, onChange, onCommit, onCancel, placeholder }: RenameInputProps) {
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    e.stopPropagation()
    if (e.key === 'Enter') onCommit()
    if (e.key === 'Escape') onCancel()
  }

  return (
    <input
      autoFocus
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onClick={(e) => e.stopPropagation()}
      onBlur={onCommit}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      className={RENAME_INPUT_CLASS}
    />
  )
}
