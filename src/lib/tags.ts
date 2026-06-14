import { supabase } from '@/lib/supabase'
import type { Tag } from '@/types'

export const DEFAULT_TAG_COLOR = '#6B7280'

/** Sentinel id used in the sidebar's tag filter set to represent "Untagged notes". */
export const UNTAGGED_FILTER_ID = '__untagged__'

/** 8 preset swatches for the tag colour picker: grey, blue, green, yellow, orange, red, purple, teal. */
export const TAG_COLOR_PRESETS = [
  '#6B7280',
  '#3B82F6',
  '#22C55E',
  '#EAB308',
  '#F97316',
  '#EF4444',
  '#A855F7',
  '#14B8A6',
]

const HASHTAG_PATTERN = /#(\w[\w-]*)/g
const MAX_TAG_LENGTH = 50

/**
 * Extracts `#hashtag` tokens from markdown content, ignoring fenced and
 * inline code blocks so snippets like `` `#define` `` aren't treated as tags.
 */
export function extractContentTags(content: string): string[] {
  const withoutCode = content.replace(/```[\s\S]*?```/g, '').replace(/`[^`]+`/g, '')

  const matches = withoutCode.match(HASHTAG_PATTERN) ?? []
  const names = matches
    .map((tag) => tag.slice(1).toLowerCase())
    .filter((tag) => tag.length <= MAX_TAG_LENGTH)

  return [...new Set(names)]
}

/**
 * Syncs `#hashtag`s found in a note's content to the `tags` and `note_tags`
 * tables: creates any missing tags and links them to the note. Additive
 * only — never removes existing links, so tags added via the tag picker
 * (which aren't written into the content) are preserved. Doesn't set `color`
 * on conflict, so re-syncing never reverts a user's colour choice.
 */
export async function syncContentTags(userId: string, noteId: string, content: string): Promise<Tag[]> {
  const names = extractContentTags(content)
  if (names.length === 0) return []

  const { data: tags, error } = await supabase
    .from('tags')
    .upsert(
      names.map((name) => ({ user_id: userId, name })),
      { onConflict: 'user_id,name', ignoreDuplicates: false }
    )
    .select('*')

  if (error || !tags) return []

  await supabase
    .from('note_tags')
    .upsert(
      tags.map((tag) => ({ note_id: noteId, tag_id: tag.id })),
      { onConflict: 'note_id,tag_id', ignoreDuplicates: true }
    )

  // Supabase client has no generated Database types, so query/RPC results are `any`.
  return tags as Tag[]
}

/** Merges newly synced tags into a note's existing tag list, de-duped by id. */
export function mergeTags(existing: Tag[], additional: Tag[]): Tag[] {
  if (additional.length === 0) return existing
  const merged = [...existing]
  for (const tag of additional) {
    if (!merged.some((t) => t.id === tag.id)) merged.push(tag)
  }
  return merged
}
