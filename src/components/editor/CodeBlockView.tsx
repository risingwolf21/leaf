import type { NodeViewProps } from '@tiptap/react'
import { NodeViewContent, NodeViewWrapper } from '@tiptap/react'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SUPPORTED_LANGUAGES } from '@/lib/highlight-languages'

export function CodeBlockView({ node, updateAttributes }: NodeViewProps) {
  const language = (node.attrs.language as string | null) ?? 'plaintext'

  return (
    <NodeViewWrapper className="leaf-code-block">
      <div className="leaf-code-block-lang-picker" contentEditable={false}>
        <Select value={language} onValueChange={(value) => updateAttributes({ language: value })}>
          <SelectTrigger
            size="sm"
            aria-label="Language"
            className="border-transparent bg-transparent font-mono text-xs hover:border-border dark:bg-transparent dark:hover:bg-transparent"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {SUPPORTED_LANGUAGES.map(({ value, label }) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      <pre>
        <NodeViewContent as="code" />
      </pre>
    </NodeViewWrapper>
  )
}
