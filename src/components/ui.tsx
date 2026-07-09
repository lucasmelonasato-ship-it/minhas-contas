import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'

// ─── Modal / Bottom sheet ────────────────────────────────────────────────────
// No celular abre como uma folha deslizando de baixo; no desktop, centralizado.
export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  maxWidth = 'max-w-lg',
}: {
  open: boolean
  onClose: () => void
  title?: ReactNode
  children: ReactNode
  footer?: ReactNode
  maxWidth?: string
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={`sheet-in relative z-10 w-full ${maxWidth} max-h-[92vh] overflow-hidden rounded-t-3xl bg-white shadow-soft sm:rounded-3xl`}
        style={{ paddingBottom: 'var(--safe-bottom)' }}
      >
        {title != null && (
          <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
            <h2 className="text-lg font-bold text-ink-900">{title}</h2>
            <button
              onClick={onClose}
              className="rounded-full p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
              aria-label="Fechar"
            >
              <X size={22} />
            </button>
          </div>
        )}
        <div className="overflow-y-auto px-5 py-4" style={{ maxHeight: 'calc(92vh - 140px)' }}>
          {children}
        </div>
        {footer != null && (
          <div className="border-t border-ink-100 px-5 py-3.5">{footer}</div>
        )}
      </div>
    </div>
  )
}

// ─── Barra de progresso ──────────────────────────────────────────────────────
export function Progress({
  value,
  className = '',
  color = 'bg-brand-600',
}: {
  value: number // 0–100
  className?: string
  color?: string
}) {
  return (
    <div className={`h-2.5 w-full overflow-hidden rounded-full bg-ink-100 ${className}`}>
      <div
        className={`h-full rounded-full ${color} transition-all duration-500`}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  )
}

// ─── Estado vazio ────────────────────────────────────────────────────────────
export function EmptyState({
  icon,
  title,
  subtitle,
  action,
}: {
  icon: ReactNode
  title: string
  subtitle?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink-200 bg-white/60 px-6 py-12 text-center">
      <div className="mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-ink-100 text-ink-400">
        {icon}
      </div>
      <p className="text-base font-semibold text-ink-800">{title}</p>
      {subtitle && <p className="mt-1 max-w-xs text-sm text-ink-500">{subtitle}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

// ─── Selo de status ──────────────────────────────────────────────────────────
export function StatusBadge({ status }: { status: 'pago' | 'pendente' | 'atrasado' | 'hoje' | 'pulado' }) {
  const map = {
    pago: 'bg-emerald-100 text-emerald-700',
    pendente: 'bg-amber-100 text-amber-700',
    atrasado: 'bg-rose-100 text-rose-700',
    hoje: 'bg-blue-100 text-blue-700',
    pulado: 'bg-ink-100 text-ink-500',
  }
  const label = {
    pago: 'Pago',
    pendente: 'Pendente',
    atrasado: 'Atrasado',
    hoje: 'Vence hoje',
    pulado: 'Pulado',
  }
  return <span className={`chip ${map[status]}`}>{label[status]}</span>
}
