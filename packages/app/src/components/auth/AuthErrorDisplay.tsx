import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AuthErrorDisplayProps {
  error: { status: 401 | 403; message: string } | null
  onConfigureClick?: () => void
}

/**
 * Inline error message component for auth errors.
 * Shows distinct messages for 401 (authentication required) vs 403 (insufficient permissions).
 */
export function AuthErrorDisplay({ error, onConfigureClick }: AuthErrorDisplayProps) {
  if (!error) return null

  const is401 = error.status === 401

  return (
    <div
      className={`flex items-start gap-2 rounded-md border p-3 ${
        is401
          ? 'bg-red-50 border-red-200 text-red-700'
          : 'bg-orange-50 border-orange-200 text-orange-700'
      }`}
    >
      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
      <div className="flex-1 space-y-2">
        <div className="text-sm">
          {is401
            ? 'This API requires authentication. Configure now?'
            : 'Credentials valid but insufficient permissions.'}
        </div>
        {is401 && onConfigureClick && (
          <Button variant="outline" size="sm" onClick={onConfigureClick}>
            Configure Authentication
          </Button>
        )}
        {!is401 && (
          <p className="text-xs opacity-80">
            Contact your API provider to request elevated permissions for this endpoint.
          </p>
        )}
      </div>
    </div>
  )
}
