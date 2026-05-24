import { useToastStore } from '@/store/toast'
import {
  CheckCircle2,
  XCircle,
  Info,
  AlertTriangle,
  X,
} from 'lucide-react'

export default function ToastViewport() {
  const toasts = useToastStore((s) => s.toasts)
  const dismiss = useToastStore((s) => s.dismiss)

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm pointer-events-none">
      {toasts.map((t) => {
        const { Icon, color } = ICONS[t.variant]
        return (
          <div
            key={t.id}
            className={`flex items-start gap-2 bg-bg-secondary border ${color.border} rounded-lg p-3 shadow-lg pointer-events-auto animate-in slide-in-from-right-4`}
          >
            <Icon size={16} className={`${color.text} mt-0.5 shrink-0`} />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium">{t.title}</div>
              {t.description && (
                <div className="text-xs text-text-secondary mt-0.5">
                  {t.description}
                </div>
              )}
            </div>
            <button
              onClick={() => dismiss(t.id)}
              className="text-text-secondary hover:text-text-primary"
            >
              <X size={14} />
            </button>
          </div>
        )
      })}
    </div>
  )
}

const ICONS = {
  info: { Icon: Info, color: { text: 'text-accent-blue', border: 'border-accent-blue/30' } },
  success: {
    Icon: CheckCircle2,
    color: { text: 'text-accent-green', border: 'border-accent-green/30' },
  },
  error: {
    Icon: XCircle,
    color: { text: 'text-accent-red', border: 'border-accent-red/30' },
  },
  warning: {
    Icon: AlertTriangle,
    color: { text: 'text-accent-orange', border: 'border-accent-orange/30' },
  },
}
