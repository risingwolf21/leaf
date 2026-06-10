import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { AuthForm } from '@/components/AuthForm'

export default function AuthPage() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Loading…
      </div>
    )
  }

  if (user) {
    return <Navigate to="/app" replace />
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <AuthForm />
    </div>
  )
}
