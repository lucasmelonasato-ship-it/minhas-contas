import { useState } from 'react'
import {
  Check,
  MoreVertical,
  Paperclip,
  RotateCcw,
  SkipForward,
  Pencil,
  Image as ImageIcon,
} from 'lucide-react'
import type { Bill, Payment } from '../db/db'
import { CategoryChip } from './CategoryIcon'
import { StatusBadge } from './ui'
import { PayModal } from './PayModal'
import { ReceiptViewer } from './ReceiptViewer'
import { BillForm } from './BillForm'
import { displayStatus } from '../lib/status'
import { formatBRL, formatDayMonth } from '../lib/format'
import { daysUntil } from '../lib/dates'
import { undoPaid, skipPayment, unskipPayment } from '../data/repo'

function dueHint(p: Payment): string {
  const st = displayStatus(p)
  if (st === 'pago') return `Pago${p.paidAmount != null ? ` · ${formatBRL(p.paidAmount)}` : ''}`
  const d = daysUntil(p.dueDate)
  if (st === 'atrasado') return `Venceu ${formatDayMonth(p.dueDate)} · ${Math.abs(d)}d atrás`
  if (st === 'hoje') return 'Vence hoje'
  if (d === 1) return 'Vence amanhã'
  return `Vence ${formatDayMonth(p.dueDate)} · em ${d}d`
}

export function PaymentRow({ payment, bill }: { payment: Payment; bill: Bill | undefined }) {
  const [showPay, setShowPay] = useState(false)
  const [showReceipt, setShowReceipt] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [menu, setMenu] = useState(false)
  const st = displayStatus(payment)
  const paid = st === 'pago'

  return (
    <div
      className={`fade-in flex items-center gap-3 rounded-2xl bg-white px-3.5 py-3 shadow-card ${
        st === 'atrasado' ? 'ring-1 ring-rose-200' : ''
      }`}
    >
      <CategoryChip category={bill?.category ?? 'outros'} />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate font-semibold text-ink-900">{bill?.name ?? 'Conta'}</p>
          {payment.installmentNumber != null && bill?.installmentsTotal != null && (
            <span className="shrink-0 rounded-md bg-ink-100 px-1.5 py-0.5 text-[10px] font-semibold text-ink-500">
              {payment.installmentNumber}/{bill.installmentsTotal}
            </span>
          )}
        </div>
        <p
          className={`truncate text-xs ${
            st === 'atrasado' ? 'font-medium text-rose-600' : 'text-ink-400'
          }`}
        >
          {dueHint(payment)}
        </p>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1">
        <span className="font-bold tabular-nums text-ink-900">{formatBRL(payment.amount)}</span>
        {paid || st === 'pulado' ? (
          <StatusBadge status={st} />
        ) : (
          <button
            onClick={() => setShowPay(true)}
            className="btn-primary px-3 py-1 text-xs"
          >
            <Check size={14} /> Pagar
          </button>
        )}
      </div>

      {/* Menu de ações */}
      <div className="relative">
        <button
          onClick={() => setMenu((m) => !m)}
          className="rounded-lg p-1.5 text-ink-300 hover:bg-ink-100 hover:text-ink-600"
          aria-label="Mais ações"
        >
          <MoreVertical size={18} />
        </button>
        {menu && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenu(false)} />
            <div className="absolute right-0 top-9 z-20 w-52 overflow-hidden rounded-xl border border-ink-100 bg-white py-1 shadow-soft">
              {payment.receiptPath && (
                <MenuItem
                  icon={<ImageIcon size={16} />}
                  label="Ver comprovante"
                  onClick={() => {
                    setMenu(false)
                    setShowReceipt(true)
                  }}
                />
              )}
              {!paid && (
                <MenuItem
                  icon={<Paperclip size={16} />}
                  label="Pagar e anexar"
                  onClick={() => {
                    setMenu(false)
                    setShowPay(true)
                  }}
                />
              )}
              {paid && (
                <MenuItem
                  icon={<RotateCcw size={16} />}
                  label="Desfazer pagamento"
                  onClick={async () => {
                    setMenu(false)
                    if (payment.id != null) await undoPaid(payment.id)
                  }}
                />
              )}
              {st !== 'pulado' && !paid && (
                <MenuItem
                  icon={<SkipForward size={16} />}
                  label="Pular este mês"
                  onClick={async () => {
                    setMenu(false)
                    if (payment.id != null) await skipPayment(payment.id)
                  }}
                />
              )}
              {st === 'pulado' && (
                <MenuItem
                  icon={<RotateCcw size={16} />}
                  label="Reativar"
                  onClick={async () => {
                    setMenu(false)
                    if (payment.id != null) await unskipPayment(payment.id)
                  }}
                />
              )}
              {bill && (
                <MenuItem
                  icon={<Pencil size={16} />}
                  label="Editar conta"
                  onClick={() => {
                    setMenu(false)
                    setShowEdit(true)
                  }}
                />
              )}
            </div>
          </>
        )}
      </div>

      {showPay && (
        <PayModal payment={payment} bill={bill} open={showPay} onClose={() => setShowPay(false)} />
      )}
      {showReceipt && (
        <ReceiptViewer
          receiptPath={payment.receiptPath}
          open={showReceipt}
          onClose={() => setShowReceipt(false)}
        />
      )}
      {showEdit && bill && (
        <BillForm open={showEdit} onClose={() => setShowEdit(false)} bill={bill} />
      )}
    </div>
  )
}

function MenuItem({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm text-ink-700 hover:bg-ink-50"
    >
      <span className="text-ink-400">{icon}</span>
      {label}
    </button>
  )
}
