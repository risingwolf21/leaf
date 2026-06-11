import { supabase } from '@/lib/supabase'

const BUCKET = 'note-images'
const SIGNED_URL_EXPIRY = 60 * 60 * 24 * 365 * 10 // 10 years, in seconds

export const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

const EXTENSION_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
}

/** Returns an error message if the file can't be uploaded, or `null` if it's valid. */
export function validateImageFile(file: File): string | null {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return 'Images must be JPEG, PNG, GIF, or WebP.'
  }
  if (file.size > MAX_IMAGE_SIZE) {
    return 'Images must be smaller than 5MB.'
  }
  return null
}

/** Uploads an image to the current user's folder in Supabase Storage and returns a long-lived signed URL. */
export async function uploadNoteImage(file: File): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('You must be signed in to upload images.')

  const extension = EXTENSION_BY_MIME[file.type] ?? 'bin'
  const path = `${user.id}/${crypto.randomUUID()}.${extension}`

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
  })
  if (uploadError) throw uploadError

  const { data, error: signError } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, SIGNED_URL_EXPIRY)
  if (signError || !data) throw signError ?? new Error('Failed to create image URL.')

  return data.signedUrl
}
