import type { NodeViewProps } from '@tiptap/react'
import { NodeViewContent, NodeViewWrapper } from '@tiptap/react'
import { SUPPORTED_LANGUAGES } from '@/lib/highlight-languages'

export function CodeBlockView({ node, updateAttributes, editor }: NodeViewProps) {
  const language = (node.attrs.language as string | null) ?? 'plaintext'
  const label = SUPPORTED_LANGUAGES.find((l) => l.value === language)?.label ?? language

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateAttributes({ language: e.target.value })
  }

  return (
    <NodeViewWrapper className="leaf-code-block">
      {editor.isEditable ? (
        <select
          className="leaf-code-block-lang-picker"
          value={language}
          onChange={handleChange}
          contentEditable={false}
          aria-label="Language"
        >
          {SUPPORTED_LANGUAGES.map(({ value, label: lbl }) => (
            <option key={value} value={value}>{lbl}</option>
          ))}
        </select>
      ) : (
        <span className="leaf-code-block-lang-label" contentEditable={false}>
          {label}
        </span>
      )}
      <pre>
        <NodeViewContent as="code" />
      </pre>
    </NodeViewWrapper>
  )
}
