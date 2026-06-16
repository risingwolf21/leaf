import type { NodeViewProps } from '@tiptap/react'
import { NodeViewContent, NodeViewWrapper } from '@tiptap/react'
import { SUPPORTED_LANGUAGES } from '@/lib/highlight-languages'

export function CodeBlockView({ node, updateAttributes }: NodeViewProps) {
  const language = (node.attrs.language as string | null) ?? 'plaintext'

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateAttributes({ language: e.target.value })
  }

  return (
    <NodeViewWrapper className="leaf-code-block">
      <select
        className="leaf-code-block-lang-picker"
        value={language}
        onChange={handleChange}
        aria-label="Language"
      >
        {SUPPORTED_LANGUAGES.map(({ value, label }) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </select>
      <pre>
        <NodeViewContent as="code" />
      </pre>
    </NodeViewWrapper>
  )
}
