import type { NodeViewProps } from '@tiptap/react'
import { NodeViewWrapper } from '@tiptap/react'
import { cn } from '@/lib/utils'

type ImageSize = 'small' | 'medium' | 'large'

const SIZES: ImageSize[] = ['small', 'medium', 'large']

export function ImageView({ node, selected, updateAttributes }: NodeViewProps) {
  const currentWidth = node.attrs.width as ImageSize

  const handleSizeClick = (size: ImageSize) => {
    updateAttributes({ width: size })
  }

  return (
    <NodeViewWrapper>
      <div className="relative w-full flex justify-center">
        {selected && (
          <div
            className="absolute -top-10 left-1/2 -translate-x-1/2 flex gap-1 rounded border bg-popover p-1 shadow-md z-10"
            contentEditable={false}
          >
            {SIZES.map((size) => (
              <button
                key={size}
                onClick={() => handleSizeClick(size)}
                className={cn(
                  'px-2 py-0.5 rounded text-xs font-medium transition-colors',
                  currentWidth === size
                    ? 'bg-accent text-accent-foreground'
                    : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                )}
              >
                {size[0].toUpperCase()}
              </button>
            ))}
          </div>
        )}
        <img
          src={node.attrs.src as string}
          alt={(node.attrs.alt as string) ?? ''}
          data-width={currentWidth}
          className="leaf-image"
        />
      </div>
    </NodeViewWrapper>
  )
}
