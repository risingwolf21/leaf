/** Returns up to `maxLength` characters of `content`, centred on the first match of `query`. */
export function getSnippet(content: string, query: string, maxLength = 120): string {
  const normalized = content.replace(/\s+/g, ' ').trim()
  if (!normalized) return ''

  const matchIndex = normalized.toLowerCase().indexOf(query.toLowerCase())
  if (matchIndex === -1) {
    return normalized.length > maxLength ? `${normalized.slice(0, maxLength).trimEnd()}…` : normalized
  }

  const matchCenter = matchIndex + query.length / 2
  let start = Math.max(0, Math.round(matchCenter - maxLength / 2))
  const end = Math.min(normalized.length, start + maxLength)
  start = Math.max(0, end - maxLength)

  let snippet = normalized.slice(start, end)
  if (start > 0) snippet = `…${snippet.trimStart()}`
  if (end < normalized.length) snippet = `${snippet.trimEnd()}…`
  return snippet
}
