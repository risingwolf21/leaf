import { useParams } from 'react-router-dom'
import { UNTAGGED_FILTER_ID } from '@/lib/tags'

/** The active tag id (or the Untagged sentinel) from the `:tagId` route param, or `null` off a tag route. */
export function useActiveTag() {
  const { tagId } = useParams<{ tagId?: string }>()

  return {
    activeTagId: tagId ?? null,
    isUntaggedActive: tagId === UNTAGGED_FILTER_ID,
  }
}
