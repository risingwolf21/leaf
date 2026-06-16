import { Upload } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export function ImportButton() {
  const navigate = useNavigate()

  return (
    <Button
      variant="outline"
      size="icon"
      aria-label="Import notes"
      title="Import notes"
      onClick={() => navigate('/app/import')}
    >
      <Upload className="h-4 w-4" />
    </Button>
  )
}
