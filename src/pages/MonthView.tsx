import { useMemo, useState } from 'react'
import { CalendarPlus, Filter, Plus } from 'lucide-react'
import { useApp } from '../AppContext'
import { useBillsMap, useMonthPayments, usePeople } from '../hooks'
import { MonthSwitcher } from '../components/MonthSwitcher'
import { PaymentRow } from '../components/PaymentRow'
import { BillForm } from '../components/BillForm'
import { EmptyState } from '../components/ui'
import { computeTotals, displayStatus, type DisplayStatus } from '../lib/status'
import { formatBRL } from '../lib/format'
import { downloadICS } from '../lib/ics'
import { CalendarDays } from 'lucide-react'

const GROUPS: { key: DisplayStatus[]; title: string; accent: string }[] = [
  { key: ['atrasado'], title: 'Atrasadas', accent: 'text-rose-600' },
  { key: ['hoje'], title: 'Vencem hoje', accent: 'text-blue-600' },
  { key: ['pendente'], title: 'A pagar', accent: 'text-amber-600' },
  { key: ['pago'], title: 'Pagas', accent: 'text-emerald-600' },
  { key: ['pulado'], title: 'Puladas', accent: 'text-ink-400' },
]

export default function MonthView() {
  const { ym } = useApp()
  const payments = useMonthPayments(ym)
  const billsMap = useBillsMap()
  const people = usePeople()
  const [showForm, setShowForm] = useState(false)
  const [ownerFilter, setOwnerFilter] = useState<string | 'all'>('all')

  const filtered = useMemo(() => {
    if (ownerFilter === 'all') return payments
    return payments.filter((p) => billsMap.get(p.billId)?.ownerId === ownerFilter)
  }, [payments, ownerFilter, billsMap])

  const totals = useMemo(() => computeTotals(filtered), [filtered])

  const grouped = useMemo(() => {
    return GROUPS.map((g) => ({
      ...g,
      items: filtered
        .filter((p) => g.key.includes(displayStatus(p)))
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    })).filter((g) => g.items.length > 0)
  }, [filtered])

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-ink-900">
          <CalendarDays size={24} className="text-brand-600" /> Contas do mês
        </h1>
        <button onClick={() => setShowForm(true)} className="btn-primary px-3.5 py-2.5">
          <Plus size={18} /> Nova
        </button>
      </header>

      <MonthSwitcher />

      {/* Resumo */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card px-4 py-3">
          <p className="text-xs text-ink-400">Total do mês</p>
          <p className="text-xl font-extrabold text-ink-900">{formatBRL(totals.total)}</p>
        </div>
        <div className="card px-4 py-3">
          <p className="text-xs text-ink-400">Falta pagar</p>
          <p className="text-xl font-extrabold text-amber-600">
            {formatBRL(totals.pendente + totals.atrasado)}
          </p>
        </div>
      </div>

      {/* Filtro por pessoa */}
      {people.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <Filter size={16} className="shrink-0 text-ink-400" />
          <button
            onClick={() => setOwnerFilter('all')}
            className={`chip shrink-0 border ${
              ownerFilter === 'all'
                ? 'border-brand-400 bg-brand-50 text-brand-700'
                : 'border-ink-200 text-ink-500'
            }`}
          >
            Todos
          </button>
          {people.map((p) => (
            <button
              key={p.id}
              onClick={() => setOwnerFilter(p.id)}
              className="chip shrink-0 border"
              style={
                ownerFilter === p.id
                  ? { borderColor: p.color, backgroundColor: `${p.color}18`, color: p.color }
                  : { borderColor: '#e2e8f0', color: '#64748b' }
              }
            >
              {p.name}
            </button>
          ))}
        </div>
      )}

      {/* Grupos */}
      {grouped.length === 0 ? (
        <EmptyState
          icon={<CalendarDays size={26} />}
          title="Nenhuma conta neste mês"
          subtitle="Cadastre suas contas para vê-las aparecer aqui automaticamente todo mês."
          action={
            <button onClick={() => setShowForm(true)} className="btn-primary px-4 py-2.5">
              <Plus size={18} /> Cadastrar conta
            </button>
          }
        />
      ) : (
        <div className="space-y-5">
          {grouped.map((g) => (
            <section key={g.title} className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <h2 className={`text-sm font-bold uppercase tracking-wide ${g.accent}`}>
                  {g.title}
                </h2>
                <span className="text-xs text-ink-400">
                  {g.items.length} · {formatBRL(g.items.reduce((s, p) => s + p.amount, 0))}
                </span>
              </div>
              <div className="space-y-2">
                {g.items.map((p) => (
                  <PaymentRow key={p.id} payment={p} bill={billsMap.get(p.billId)} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {filtered.length > 0 && (
        <button
          onClick={() => downloadICS(filtered, `contas-${ym}.ics`)}
          className="btn-ghost w-full py-3"
        >
          <CalendarPlus size={18} /> Adicionar vencimentos ao calendário do iPhone
        </button>
      )}

      {showForm && <BillForm open={showForm} onClose={() => setShowForm(false)} />}
    </div>
  )
}
