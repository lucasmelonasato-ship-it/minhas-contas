import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, FileText, Image as ImageIcon } from 'lucide-react'
import type { Payment } from '../db/db'
import { useApp } from '../AppContext'
import { useAllPayments, useBillsMap } from '../hooks'
import { receiptSignedUrl } from '../data/repo'
import { ReceiptViewer } from '../components/ReceiptViewer'
import { EmptyState } from '../components/ui'
import { formatBRL } from '../lib/format'

function Thumb({
  payment,
  title,
  subtitle,
  onClick,
}: {
  payment: Payment
  title: string
  subtitle: string
  onClick: () => void
}) {
  const [url, setUrl] = useState<string | undefined>()
  const isPdf = payment.receiptPath?.toLowerCase().endsWith('.pdf')

  useEffect(() => {
    let active = true
    if (payment.receiptPath && !isPdf) {
      receiptSignedUrl(payment.receiptPath).then((u) => {
        if (active) setUrl(u)
      })
    }
    return () => {
      active = false
    }
  }, [payment.receiptPath, isPdf])

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
  const payments = useAllPayments()
  const billsMap = useBillsMap()
  const [viewing, setViewing] = useState<string | undefined>()

  const receipts = useMemo(
    () =>
      payments
        .filter((p) => p.receiptPath)
        .sort((a, b) => (b.paidAt ?? b.createdAt).localeCompare(a.paidAt ?? a.createdAt)),
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
          {receipts.map((p) => {
            const bill = billsMap.get(p.billId)
            return (
              <Thumb
                key={p.id}
                payment={p}
                title={bill?.name ?? 'Conta'}
                subtitle={formatBRL(p.paidAmount ?? p.amount)}
                onClick={() => setViewing(p.receiptPath)}
              />
            )
          })}
        </div>
      )}

      {viewing != null && (
        <ReceiptViewer receiptPath={viewing} open={viewing != null} onClose={() => setViewing(undefined)} />
      )}
    </div>
  )
}
