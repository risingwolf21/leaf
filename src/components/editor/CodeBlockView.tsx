import type { NodeViewProps } from '@tiptap/react'
import { NodeViewContent, NodeViewWrapper } from '@tiptap/react'
import { SUPPORTED_LANGUAGES } from '@/lib/highlight-languages'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectGroup } from '../ui/select'
import { Languages } from 'lucide-react'
import { Button } from '../ui/button'

export function CodeBlockView({ node, updateAttributes }: NodeViewProps) {
  const language = (node.attrs.language as string | null) ?? 'plaintext'

  return (
    <NodeViewWrapper className="leaf-code-block">
      <Select
        items={SUPPORTED_LANGUAGES}
        value={language}
        onValueChange={(value) => updateAttributes({ language: value })}
      >
        <SelectTrigger
          render={(_p, v) => <Button variant="outline">
            {SUPPORTED_LANGUAGES.find((lang) => lang.value === v.value)?.label || 'Select language'}
            <Languages />
          </Button>} />
        <SelectContent>
          <SelectGroup>
            {SUPPORTED_LANGUAGES.map(({ value, label }) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      <pre>
        <NodeViewContent as="code" />
      </pre>
    </NodeViewWrapper>
  )
}
