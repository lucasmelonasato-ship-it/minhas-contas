import { useEffect, useState } from 'react'
import { Download, FileText } from 'lucide-react'
import { db, type Receipt } from '../db/db'
import { Modal } from './ui'
import { triggerDownload } from '../lib/ics'
import { formatDateTime } from '../lib/format'

export function ReceiptViewer({
  receiptId,
  open,
  onClose,
}: {
  receiptId: number | undefined
  open: boolean
  onClose: () => void
}) {
  const [receipt, setReceipt] = useState<Receipt | undefined>()
  const [url, setUrl] = useState<string | undefined>()

  useEffect(() => {
    let active = true
    let objectUrl: string | undefined
    if (open && receiptId != null) {
      db.receipts.get(receiptId).then((r) => {
        if (!active) return
        setReceipt(r)
        if (r) {
          objectUrl = URL.createObjectURL(r.blob)
          setUrl(objectUrl)
        }
      })
    }
    return () => {
      active = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
      setUrl(undefined)
      setReceipt(undefined)
    }
  }, [open, receiptId])

  const isPdf = receipt?.mime.includes('pdf')

  return (
    <Modal open={open} onClose={onClose} title="Comprovante">
      {!receipt && <p className="py-8 text-center text-ink-400">Carregando…</p>}
      {receipt && (
        <div className="space-y-4">
          {url && isPdf ? (
            <div className="flex flex-col items-center gap-3 rounded-xl bg-ink-50 py-10">
              <FileText size={48} className="text-ink-400" />
              <p className="text-sm text-ink-500">{receipt.filename}</p>
            </div>
          ) : (
            url && (
              <img
                src={url}
                alt="Comprovante"
                className="mx-auto max-h-[60vh] w-full rounded-xl object-contain"
              />
            )
          )}
          <div className="flex items-center justify-between text-xs text-ink-400">
            <span>Anexado em {formatDateTime(receipt.createdAt)}</span>
            <button
              onClick={() => triggerDownload(receipt.blob, receipt.filename)}
              className="btn-ghost px-3 py-1.5 text-xs"
            >
              <Download size={14} /> Baixar
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}
