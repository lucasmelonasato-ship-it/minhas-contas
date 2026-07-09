import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowLeft, FileText, Image as ImageIcon } from 'lucide-react'
import { db, type Receipt } from '../db/db'
import { useApp } from '../AppContext'
import { useBillsMap } from '../hooks'
import { ReceiptViewer } from '../components/ReceiptViewer'
import { EmptyState } from '../components/ui'
import { formatBRL } from '../lib/format'

function Thumb({ receipt, onClick, subtitle, title }: {
  receipt: Receipt
  onClick: () => void
  title: string
  subtitle: string
}) {
  const url = useMemo(
    () => (receipt.mime.includes('pdf') ? undefined : URL.createObjectURL(receipt.blob)),
    [receipt],
  )
  return (
    <button onClick={onClick} className="group text-left">
      <div className="relative aspect-square overflow-hidden rounded-xl bg-ink-100">
        {url ? (
          <img src={url} alt={title} className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full w-full place-items-center text-ink-400">
            <FileText size={30} />
          </div>
        )}
      </div>
      <p className="mt-1 truncate text-xs font-semibold text-ink-800">{title}</p>
      <p className="truncate text-[11px] text-ink-400">{subtitle}</p>
    </button>
  )
}

export default function ReceiptsPage() {
  const { setTab } = useApp()
  const receipts = useLiveQuery(() => db.receipts.orderBy('createdAt').reverse().toArray(), [], [])
  const payments = useLiveQuery(() => db.payments.toArray(), [], [])
  const billsMap = useBillsMap()
  const [viewing, setViewing] = useState<number | undefined>()

  const paymentById = useMemo(
    () => new Map(payments.filter((p) => p.id != null).map((p) => [p.id!, p])),
    [payments],
  )

  return (
    <div className="space-y-5">
      <header className="flex items-center gap-3">
        <button
          onClick={() => setTab('ajustes')}
          className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100"
        >
          <ArrowLeft size={22} />
        </button>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-ink-900">
          <ImageIcon size={24} className="text-brand-600" /> Comprovantes
        </h1>
      </header>

      {receipts.length === 0 ? (
        <EmptyState
          icon={<ImageIcon size={26} />}
          title="Nenhum comprovante ainda"
          subtitle="Ao registrar um pagamento, anexe a foto ou PDF do comprovante. Eles aparecem aqui."
        />
      ) : (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {receipts.map((r) => {
            const payment = r.paymentId != null ? paymentById.get(r.paymentId) : undefined
            const bill = payment ? billsMap.get(payment.billId) : undefined
            return (
              <Thumb
                key={r.id}
                receipt={r}
                title={bill?.name ?? r.filename}
                subtitle={payment ? formatBRL(payment.paidAmount ?? payment.amount) : ''}
                onClick={() => setViewing(r.id)}
              />
            )
          })}
        </div>
      )}

      {viewing != null && (
        <ReceiptViewer receiptId={viewing} open={viewing != null} onClose={() => setViewing(undefined)} />
      )}
    </div>
  )
}
