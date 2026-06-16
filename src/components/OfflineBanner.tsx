import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { useOfflineSync } from '@/hooks/useOfflineSync'

export function OfflineBanner() {
  const isOnline = useOnlineStatus()
  const { pendingCount } = useOfflineSync()

  if (isOnline) return null

  const pendingSuffix =
    pendingCount > 0
      ? `. ${pendingCount} change${pendingCount !== 1 ? 's' : ''} pending.`
      : '.'

  return (
    <div className="flex items-center gap-2 bg-amber-500/15 px-4 py-2 text-sm text-amber-700 dark:text-amber-400 border-b border-amber-200 dark:border-amber-800">
      <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />
      <span>
        Offline — changes are saved locally and will sync on reconnect
        {pendingSuffix}
      </span>
    </div>
  )
}
