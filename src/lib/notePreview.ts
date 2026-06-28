const STRIP_PATTERNS: [RegExp, string][] = [
  [/```[\s\S]*?```/g, ''],
  [/!\[([^\]]*)\]\([^)]*\)/g, ''],
  [/\[([^\]]*)\]\([^)]*\)/g, '$1'],
  [/^#{1,6}\s+/gm, ''],
  [/^>+\s*/gm, ''],
  [/^[-*+]\s+/gm, ''],
  [/^\d+\.\s+/gm, ''],
  [/(\*\*|__)(.*?)\1/g, '$2'],
  [/(\*|_)(.*?)\1/g, '$2'],
  [/`{1,3}([^`]*)`{1,3}/g, '$1'],
]

function stripMarkdown(content: string): string {
  return STRIP_PATTERNS.reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), content)
}

/** Returns up to `maxLength` characters of `content` with markdown syntax stripped, for folder-browser previews. */
export function getPreviewText(content: string, maxLength = 140): string {
  const stripped = stripMarkdown(content).replace(/\s+/g, ' ').trim()
  if (!stripped) return ''
  return stripped.length > maxLength ? `${stripped.slice(0, maxLength).trimEnd()}…` : stripped
}
