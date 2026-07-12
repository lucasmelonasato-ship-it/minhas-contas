import { useMemo, useState } from 'react'
import { Repeat, CreditCard, CalendarClock } from 'lucide-react'
import {
  type Bill,
  type BillType,
  type CategoryKey,
  type Frequency,
} from '../db/db'
import { CATEGORIES } from '../lib/categories'
import { CategoryIcon } from './CategoryIcon'
import { Modal } from './ui'
import { MoneyInput } from './MoneyInput'
import { previewOccurrences } from '../lib/occurrences'
import { addBill, updateBill, ensureMonthPayments } from '../data/repo'
import { usePeople } from '../hooks'
import { currentYM, parseYM, toYM } from '../lib/dates'
import { formatBRL, formatMonthShort } from '../lib/format'
import { useApp } from '../AppContext'

type BillDraft = Omit<Bill, 'id' | 'createdAt'>

const TYPES: { key: BillType; label: string; icon: typeof Repeat; hint: string }[] = [
  { key: 'recorrente', label: 'Recorrente', icon: Repeat, hint: 'Repete todo mês (ou ano)' },
  { key: 'parcelado', label: 'Parcelado', icon: CreditCard, hint: 'Financiamento / nº de parcelas' },
  { key: 'avulsa', label: 'Avulsa', icon: CalendarClock, hint: 'Uma vez só, numa data' },
]

interface FormState {
  name: string
  category: CategoryKey
  type: BillType
  amount: number
  frequency: Frequency
  dueDay: number
  startMonthInput: string
  dueDateInput: string
  installmentsTotal: number
  ownerId?: string
  autopay: boolean
  notes: string
  active: boolean
}

function billToForm(bill?: Bill): FormState {
  const cur = parseYM(currentYM())
  if (!bill) {
    return {
      name: '',
      category: 'outros',
      type: 'recorrente',
      amount: 0,
      frequency: 'mensal',
      dueDay: 10,
      startMonthInput: currentYM(),
      dueDateInput: `${currentYM()}-10`,
      installmentsTotal: 12,
      ownerId: undefined,
      autopay: false,
      notes: '',
      active: true,
    }
  }
  return {
    name: bill.name,
    category: bill.category,
    type: bill.type,
    amount: bill.amount,
    frequency: bill.frequency ?? 'mensal',
    dueDay: bill.dueDay,
    startMonthInput: toYM(bill.startYear, bill.startMonth),
    dueDateInput:
      bill.type === 'avulsa'
        ? `${toYM(bill.dueYear ?? cur.year, bill.dueMonth ?? cur.month)}-${String(
            bill.dueDay,
          ).padStart(2, '0')}`
        : `${currentYM()}-10`,
    installmentsTotal: bill.installmentsTotal ?? 12,
    ownerId: bill.ownerId,
    autopay: bill.autopay,
    notes: bill.notes ?? '',
    active: bill.active,
  }
}

export function BillForm({
  open,
  onClose,
  bill,
}: {
  open: boolean
  onClose: () => void
  bill?: Bill
}) {
  const { ym } = useApp()
  const people = usePeople()
  const [f, setF] = useState<FormState>(() => billToForm(bill))
  const [saving, setSaving] = useState(false)

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setF((prev) => ({ ...prev, [key]: value }))
  }

  const draft = useMemo<BillDraft>(() => {
    const start = parseYM(f.startMonthInput)
    let dueDay = f.dueDay
    let dueMonth: number | undefined
    let dueYear: number | undefined
    let startYear = start.year
    let startMonth = start.month
    if (f.type === 'avulsa' && f.dueDateInput) {
      const [y, m, d] = f.dueDateInput.split('-').map(Number)
      dueYear = y
      dueMonth = m
      dueDay = d
      startYear = y
      startMonth = m
    }
    if (f.type === 'recorrente' && f.frequency === 'anual') {
      dueMonth = start.month
    }
    return {
      name: f.name || 'Nova conta',
      category: f.category,
      type: f.type,
      amount: f.amount,
      frequency: f.type === 'recorrente' ? f.frequency : undefined,
      dueDay,
      dueMonth,
      dueYear,
      startYear,
      startMonth,
      installmentsTotal: f.type === 'parcelado' ? f.installmentsTotal : undefined,
      ownerId: f.ownerId,
      autopay: f.autopay,
      notes: f.notes,
      active: f.active,
    }
  }, [f])

  const preview = useMemo(
    () => previewOccurrences(draft, f.startMonthInput, f.type === 'avulsa' ? 1 : 4),
    [draft, f.startMonthInput, f.type],
  )

  const totalParcelado = f.type === 'parcelado' ? f.amount * f.installmentsTotal : 0

  async function handleSave() {
    if (!f.name.trim() || f.amount <= 0) return
    setSaving(true)
    try {
      const payload: BillDraft = { ...draft, name: f.name.trim() }
      if (bill?.id) {
        await updateBill(bill.id, payload)
      } else {
        await addBill(payload)
      }
      await ensureMonthPayments(ym)
      await ensureMonthPayments(currentYM())
      onClose()
    } catch (e) {
      console.error(e)
      alert('Não foi possível salvar. Verifique sua conexão e tente de novo.')
    } finally {
      setSaving(false)
    }
  }

  const amountLabel =
    f.type === 'parcelado' ? 'Valor da parcela' : f.type === 'avulsa' ? 'Valor' : 'Valor mensal'

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={bill ? 'Editar conta' : 'Nova conta'}
      footer={
        <button
          onClick={handleSave}
          disabled={saving || !f.name.trim() || f.amount <= 0}
          className="btn-primary w-full py-3.5 text-base disabled:opacity-50"
        >
          {saving ? 'Salvando…' : bill ? 'Salvar alterações' : 'Cadastrar conta'}
        </button>
      }
    >
      <div className="space-y-5">
        {/* Nome */}
        <div>
          <label className="label">Nome da conta</label>
          <input
            className="input"
            placeholder="Ex.: Financiamento do carro"
            value={f.name}
            onChange={(e) => set('name', e.target.value)}
            autoFocus
          />
        </div>

        {/* Tipo */}
        <div>
          <label className="label">Tipo</label>
          <div className="grid grid-cols-3 gap-2">
            {TYPES.map((t) => {
              const Icon = t.icon
              const active = f.type === t.key
              return (
                <button
                  key={t.key}
                  onClick={() => set('type', t.key)}
                  className={`flex flex-col items-center gap-1 rounded-xl border-2 px-2 py-3 text-center transition ${
                    active
                      ? 'border-brand-500 bg-brand-50 text-brand-700'
                      : 'border-ink-100 bg-white text-ink-500'
                  }`}
                >
                  <Icon size={20} />
                  <span className="text-xs font-semibold">{t.label}</span>
                </button>
              )
            })}
          </div>
          <p className="mt-1.5 text-xs text-ink-400">
            {TYPES.find((t) => t.key === f.type)?.hint}
          </p>
        </div>

        {/* Valor */}
        <div>
          <label className="label">{amountLabel}</label>
          <MoneyInput valueCents={f.amount} onChange={(c) => set('amount', c)} />
          {f.type === 'parcelado' && f.amount > 0 && (
            <p className="mt-1.5 text-xs text-ink-500">
              Total do financiamento: <strong>{formatBRL(totalParcelado)}</strong> em{' '}
              {f.installmentsTotal}x
            </p>
          )}
        </div>

        {/* Categoria */}
        <div>
          <label className="label">Categoria</label>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
            {CATEGORIES.map((c) => {
              const active = f.category === c.key
              return (
                <button
                  key={c.key}
                  onClick={() => set('category', c.key)}
                  title={c.label}
                  className={`flex flex-col items-center gap-1 rounded-xl border px-1 py-2.5 transition ${
                    active ? 'border-2' : 'border border-ink-100'
                  }`}
                  style={active ? { borderColor: c.color, backgroundColor: `${c.color}12` } : {}}
                >
                  <span style={{ color: c.color }}>
                    <CategoryIcon category={c.key} size={20} />
                  </span>
                  <span className="w-full truncate text-center text-[10px] font-medium text-ink-500">
                    {c.label.split(' ')[0]}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Datas por tipo */}
        {f.type === 'avulsa' ? (
          <div>
            <label className="label">Data de vencimento</label>
            <input
              type="date"
              className="input"
              value={f.dueDateInput}
              onChange={(e) => set('dueDateInput', e.target.value)}
            />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Dia do vencimento</label>
              <input
                type="number"
                min={1}
                max={31}
                className="input"
                value={f.dueDay}
                onChange={(e) => set('dueDay', Math.max(1, Math.min(31, Number(e.target.value) || 1)))}
              />
            </div>
            <div>
              <label className="label">
                {f.type === 'parcelado' ? '1ª parcela em' : 'Começa em'}
              </label>
              <input
                type="month"
                className="input"
                value={f.startMonthInput}
                onChange={(e) => set('startMonthInput', e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Recorrência / parcelas */}
        {f.type === 'recorrente' && (
          <div>
            <label className="label">Frequência</label>
            <div className="grid grid-cols-2 gap-2">
              {(['mensal', 'anual'] as Frequency[]).map((fr) => (
                <button
                  key={fr}
                  onClick={() => set('frequency', fr)}
                  className={`rounded-xl border-2 py-2.5 text-sm font-semibold capitalize transition ${
                    f.frequency === fr
                      ? 'border-brand-500 bg-brand-50 text-brand-700'
                      : 'border-ink-100 bg-white text-ink-500'
                  }`}
                >
                  {fr}
                </button>
              ))}
            </div>
          </div>
        )}

        {f.type === 'parcelado' && (
          <div>
            <label className="label">Quantidade de parcelas</label>
            <input
              type="number"
              min={1}
              max={480}
              className="input"
              value={f.installmentsTotal}
              onChange={(e) =>
                set('installmentsTotal', Math.max(1, Number(e.target.value) || 1))
              }
            />
          </div>
        )}

        {/* Responsável */}
        <div>
          <label className="label">Responsável</label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => set('ownerId', undefined)}
              className={`chip border ${
                f.ownerId == null ? 'border-brand-400 bg-brand-50 text-brand-700' : 'border-ink-200 text-ink-500'
              }`}
            >
              Sem responsável
            </button>
            {people.map((p) => (
              <button
                key={p.id}
                onClick={() => set('ownerId', p.id)}
                className="chip border"
                style={
                  f.ownerId === p.id
                    ? { borderColor: p.color, backgroundColor: `${p.color}18`, color: p.color }
                    : { borderColor: '#e2e8f0', color: '#64748b' }
                }
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        {/* Débito automático */}
        <label className="flex cursor-pointer items-center justify-between rounded-xl bg-ink-50 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-ink-800">Débito automático</p>
            <p className="text-xs text-ink-400">Marque se já é descontado sozinho</p>
          </div>
          <input
            type="checkbox"
            className="h-6 w-6 accent-brand-600"
            checked={f.autopay}
            onChange={(e) => set('autopay', e.target.checked)}
          />
        </label>

        {/* Observação */}
        <div>
          <label className="label">Observação (opcional)</label>
          <input
            className="input"
            placeholder="Ex.: banco, código, detalhes"
            value={f.notes}
            onChange={(e) => set('notes', e.target.value)}
          />
        </div>

        {/* Prévia */}
        {f.amount > 0 && preview.length > 0 && (
          <div className="rounded-xl border border-ink-100 bg-ink-50/60 px-4 py-3">
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-400">
              Próximos lançamentos
            </p>
            <div className="flex flex-wrap gap-1.5">
              {preview.map((o) => (
                <span key={o.ym} className="chip bg-white text-xs text-ink-600 shadow-card">
                  {formatMonthShort(o.ym)}
                  {o.installmentNumber ? ` · ${o.installmentNumber}/${f.installmentsTotal}` : ''}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
