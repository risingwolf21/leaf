import type { KeyboardEvent } from 'react'
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Keydown handler that invokes `handler` on Enter/Space, for `role="button"` elements. */
export function onActivateKey(handler: () => void) {
  return (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handler()
    }
  }
}

const RELATIVE_TIME_UNITS: { unit: Intl.RelativeTimeFormatUnit; ms: number }[] = [
  { unit: 'year', ms: 365 * 24 * 60 * 60 * 1000 },
  { unit: 'month', ms: 30 * 24 * 60 * 60 * 1000 },
  { unit: 'day', ms: 24 * 60 * 60 * 1000 },
  { unit: 'hour', ms: 60 * 60 * 1000 },
  { unit: 'minute', ms: 60 * 1000 },
]

const relativeTimeFormatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })
const dateFormatter = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

/** Formats a past ISO timestamp as a relative string, e.g. "2 hours ago". */
export function formatRelativeTime(dateString: string): string {
  const diffMs = new Date(dateString).getTime() - Date.now()

  for (const { unit, ms } of RELATIVE_TIME_UNITS) {
    if (Math.abs(diffMs) >= ms) {
      return relativeTimeFormatter.format(Math.round(diffMs / ms), unit)
    }
  }

  return relativeTimeFormatter.format(Math.round(diffMs / 1000), 'second')
}

/** Formats an ISO timestamp as e.g. "12 Jun 2026". */
export function formatDate(dateString: string): string {
  return dateFormatter.format(new Date(dateString))
}
