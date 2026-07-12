import { useRef, useState } from 'react'
import { Camera, Check, FileText, Paperclip, Trash2 } from 'lucide-react'
import { type Bill, type Payment } from '../db/db'
import { markPaid } from '../data/repo'
import { usePeople } from '../hooks'
import { formatBRL } from '../lib/format'
import { todayISO } from '../lib/dates'
import { Modal } from './ui'
import { MoneyInput } from './MoneyInput'

export function PayModal({
  payment,
  bill,
  open,
  onClose,
}: {
  payment: Payment
  bill: Bill | undefined
  open: boolean
  onClose: () => void
}) {
  const people = usePeople()
  const [amount, setAmount] = useState(payment.amount)
  const [paidById, setPaidById] = useState<string | undefined>(
    payment.paidById ?? bill?.ownerId,
  )
  const [paidAt, setPaidAt] = useState(todayISO())
  const [file, setFile] = useState<File | null>(null)
  const [notes, setNotes] = useState(payment.notes ?? '')
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleSave() {
    setSaving(true)
    try {
      await markPaid(payment, {
        paidAmount: amount,
        paidById,
        paidAt: new Date(paidAt + 'T12:00:00').toISOString(),
        notes: notes.trim() || undefined,
        receiptFile: file,
      })
      onClose()
    } catch (e) {
      console.error(e)
      alert('Não foi possível registrar o pagamento. Verifique sua conexão.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        <span className="flex items-center gap-2">
          <Check size={20} className="text-emerald-600" /> Registrar pagamento
        </span>
      }
      footer={
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary w-full py-3.5 text-base disabled:opacity-60"
        >
          {saving ? 'Salvando…' : 'Confirmar pagamento'}
        </button>
      }
    >
      <div className="space-y-4">
        <div className="rounded-xl bg-ink-50 px-4 py-3">
          <p className="text-sm text-ink-500">Conta</p>
          <p className="text-base font-semibold text-ink-900">{bill?.name ?? 'Conta'}</p>
          <p className="text-xs text-ink-400">
            Valor previsto: {formatBRL(payment.amount)}
          </p>
        </div>

        <div>
          <label className="label">Valor pago</label>
          <MoneyInput valueCents={amount} onChange={setAmount} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Data do pagamento</label>
            <input
              type="date"
              className="input"
              value={paidAt}
              onChange={(e) => setPaidAt(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Pago por</label>
            <select
              className="input"
              value={paidById ?? ''}
              onChange={(e) => setPaidById(e.target.value || undefined)}
            >
              <option value="">—</option>
              {people.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="label">Comprovante</label>
          <input
            ref={fileRef}
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          {file ? (
            <div className="flex items-center gap-3 rounded-xl border border-ink-200 bg-white px-3.5 py-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
                {file.type.includes('pdf') ? <FileText size={20} /> : <Camera size={20} />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink-800">{file.name}</p>
                <p className="text-xs text-ink-400">{(file.size / 1024).toFixed(0)} KB</p>
              </div>
              <button
                onClick={() => {
                  setFile(null)
                  if (fileRef.current) fileRef.current.value = ''
                }}
                className="rounded-lg p-2 text-ink-400 hover:bg-ink-100 hover:text-rose-600"
                aria-label="Remover"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              className="btn-ghost w-full border border-dashed border-ink-300 py-3.5"
            >
              <Paperclip size={18} /> Anexar foto ou PDF
            </button>
          )}
          <p className="mt-1.5 text-xs text-ink-400">
            No iPhone você pode tirar a foto na hora ou escolher da galeria.
          </p>
        </div>

        <div>
          <label className="label">Observação (opcional)</label>
          <input
            className="input"
            placeholder="Ex.: paguei via Pix"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </div>
    </Modal>
  )
}
