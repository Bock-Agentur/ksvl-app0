import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

function formatTimestamp(timestamp?: Date): string {
  if (!timestamp) return ""
  
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(timestamp)
}

function formatUserRole(role?: string): string {
  const roleMap: Record<string, string> = {
    'mitglied': 'Mitglied',
    'kranfuehrer': 'Kranführer',
    'admin': 'Admin'
  }
  return roleMap[role || 'mitglied'] || 'Mitglied'
}

export function Toaster() {
  const { toasts, dismiss } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, timestamp, userName, userRole, ...props }) {
        return (
          <Toast 
            key={id} 
            {...props}
            className="cursor-pointer"
            onClick={() => dismiss(id)}
          >
            <div className="grid gap-1">
              <div className="flex items-center justify-between">
                {title && <ToastTitle>{title}</ToastTitle>}
                {timestamp && (
                  <span className="text-xs text-muted-foreground">
                    {formatTimestamp(timestamp)}
                  </span>
                )}
              </div>
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
              {(userName || userRole) && (
                <div className="text-xs text-muted-foreground mt-1 border-t pt-1">
                  {userName && <span>Benutzer: {userName}</span>}
                  {userName && userRole && <span className="mx-2">•</span>}
                  {userRole && <span>Rolle: {formatUserRole(userRole)}</span>}
                </div>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
