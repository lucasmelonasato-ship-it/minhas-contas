import { useEffect, useState } from 'react'
import { Download, FileText } from 'lucide-react'
import { Modal } from './ui'
import { receiptSignedUrl, downloadReceipt } from '../data/repo'
import { triggerDownload } from '../lib/ics'

export function ReceiptViewer({
  receiptPath,
  open,
  onClose,
}: {
  receiptPath: string | undefined
  open: boolean
  onClose: () => void
}) {
  const [url, setUrl] = useState<string | undefined>()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    setLoading(true)
    setUrl(undefined)
    if (open && receiptPath) {
      receiptSignedUrl(receiptPath).then((u) => {
        if (active) {
          setUrl(u)
          setLoading(false)
        }
      })
    } else {
      setLoading(false)
    }
    return () => {
      active = false
    }
  }, [open, receiptPath])

  const isPdf = receiptPath?.toLowerCase().endsWith('.pdf')
  const filename = receiptPath?.split('/').pop() ?? 'comprovante'

  return (
    <Modal open={open} onClose={onClose} title="Comprovante">
      {loading ? (
        <p className="py-10 text-center text-ink-400">Carregando…</p>
      ) : !url ? (
        <p className="py-10 text-center text-ink-400">Não foi possível abrir o comprovante.</p>
      ) : (
        <div className="space-y-4">
          {isPdf ? (
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="flex flex-col items-center gap-3 rounded-xl bg-ink-50 py-10 text-ink-500"
            >
              <FileText size={48} className="text-ink-400" />
              <span className="text-sm font-medium">Abrir PDF</span>
            </a>
          ) : (
            <img
              src={url}
              alt="Comprovante"
              className="mx-auto max-h-[60vh] w-full rounded-xl object-contain"
            />
          )}
          <div className="flex justify-end">
            <button
              onClick={async () => {
                if (!receiptPath) return
                const blob = await downloadReceipt(receiptPath)
                if (blob) triggerDownload(blob, filename)
              }}
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
