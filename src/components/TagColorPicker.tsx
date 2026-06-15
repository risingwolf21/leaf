import { Check } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { TAG_COLOR_PRESETS } from '@/lib/tags'

type TagColorPickerProps = {
  color: string
  onChange: (color: string) => void
}

/** 8-swatch colour picker for a tag's `color` field, used by the Tags sidebar panel. */
export function TagColorPicker({ color, onChange }: TagColorPickerProps) {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <button
            type="button"
            aria-label="Change tag colour"
            className="h-4 w-4 shrink-0 rounded-full ring-1 ring-foreground/10"
            style={{ backgroundColor: color }}
          />
        }
      />
      <PopoverContent align="start" className="w-auto">
        <div className="grid grid-cols-4 gap-1.5">
          {TAG_COLOR_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              aria-label={`Set tag colour to ${preset}`}
              onClick={() => onChange(preset)}
              className="flex h-7 w-7 items-center justify-center rounded-full ring-1 ring-foreground/10"
              style={{ backgroundColor: preset }}
            >
              {preset.toLowerCase() === color.toLowerCase() && (
                <Check className="h-3.5 w-3.5 text-white drop-shadow" />
              )}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
