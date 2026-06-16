import { Printer } from 'lucide-react'
import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import type { Note } from '@/types'

export function PrintButton({ note }: { note: Note }) {
  const handlePrint = () => {
    const original = document.title
    document.title = note.title || 'Untitled'
    window.print()
    document.title = original
  }

  return (
    <DropdownMenuItem onClick={handlePrint}>
      <Printer className="mr-2 h-4 w-4" />
      Print / Export PDF
    </DropdownMenuItem>
  )
}
