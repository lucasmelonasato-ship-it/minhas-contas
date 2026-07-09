import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  CalendarPlus,
  Plus,
  Sparkles,
  TrendingUp,
  Wallet,
  CheckCircle2,
} from 'lucide-react'
import { useApp } from '../AppContext'
import { useBillsMap, useMonthPayments } from '../hooks'
import { MonthSwitcher } from '../components/MonthSwitcher'
import { PaymentRow } from '../components/PaymentRow'
import { BillForm } from '../components/BillForm'
import { EmptyState, Progress } from '../components/ui'
import { computeTotals, displayStatus } from '../lib/status'
import { formatBRL } from '../lib/format'
import { daysUntil, currentYM } from '../lib/dates'
import { downloadICS } from '../lib/ics'

export default function Dashboard() {
  const { ym, setTab } = useApp()
  const payments = useMonthPayments(ym)
  const billsMap = useBillsMap()
  const [showForm, setShowForm] = useState(false)

  const totals = useMemo(() => computeTotals(payments), [payments])

  const pending = useMemo(
    () =>
      payments
        .filter((p) => {
          const st = displayStatus(p)
          return st === 'pendente' || st === 'atrasado' || st === 'hoje'
        })
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    [payments],
  )

  const overdue = pending.filter((p) => displayStatus(p) === 'atrasado')
  const soon = pending.filter((p) => {
    const d = daysUntil(p.dueDate)
    return d >= 0 && d <= 3
  })

  const pctPaid = totals.total > 0 ? (totals.pago / totals.total) * 100 : 0
  const allDone = totals.countTotal > 0 && totals.countPago === totals.countTotal
  const isCurrent = ym === currentYM()

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm text-ink-400">{isCurrent ? 'Este mês' : 'Resumo do mês'}</p>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink-900">Minhas Contas</h1>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary px-3.5 py-2.5">
          <Plus size={18} /> Nova
        </button>
      </header>

      <MonthSwitcher />

      {/* Card principal */}
      <div className="card overflow-hidden">
        <div className="bg-gradient-to-br from-brand-600 to-brand-800 px-5 py-5 text-white">
          <p className="text-sm text-brand-100">Falta pagar</p>
          <p className="text-4xl font-extrabold tracking-tight">
            {formatBRL(totals.pendente + totals.atrasado)}
          </p>
          <div className="mt-4 space-y-2">
            <Progress
              value={pctPaid}
              color="bg-white"
              className="bg-white/25"
            />
            <div className="flex justify-between text-xs text-brand-100">
              <span>{formatBRL(totals.pago)} pago</span>
              <span>Total do mês: {formatBRL(totals.total)}</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 divide-x divide-ink-100">
          <Stat label="A pagar" value={totals.countPendente} tone="amber" />
          <Stat label="Atrasadas" value={totals.countAtrasado} tone="rose" />
          <Stat label="Pagas" value={totals.countPago} tone="emerald" />
        </div>
      </div>

      {/* Alertas */}
      {overdue.length > 0 && (
        <div className="flex items-start gap-3 rounded-2xl bg-rose-50 px-4 py-3.5 ring-1 ring-rose-200">
          <AlertTriangle size={22} className="mt-0.5 shrink-0 text-rose-500" />
          <div>
            <p className="font-semibold text-rose-800">
              {overdue.length} conta{overdue.length > 1 ? 's' : ''} atrasada
              {overdue.length > 1 ? 's' : ''}
            </p>
            <p className="text-sm text-rose-600">
              Total de {formatBRL(overdue.reduce((s, p) => s + p.amount, 0))} vencido. Pague o
              quanto antes para evitar bloqueio.
            </p>
          </div>
        </div>
      )}

      {overdue.length === 0 && soon.length > 0 && (
        <div className="flex items-start gap-3 rounded-2xl bg-amber-50 px-4 py-3.5 ring-1 ring-amber-200">
          <CalendarPlus size={22} className="mt-0.5 shrink-0 text-amber-500" />
          <div>
            <p className="font-semibold text-amber-800">
              {soon.length} conta{soon.length > 1 ? 's' : ''} vencendo em breve
            </p>
            <p className="text-sm text-amber-700">Nos próximos 3 dias. Deixe separado para pagar.</p>
          </div>
        </div>
      )}

      {/* Tudo pago */}
      {allDone && (
        <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 px-4 py-4 ring-1 ring-emerald-200">
          <CheckCircle2 size={26} className="shrink-0 text-emerald-500" />
          <div>
            <p className="font-bold text-emerald-800">Tudo pago neste mês! 🎉</p>
            <p className="text-sm text-emerald-600">Você está em dia. Pode relaxar.</p>
          </div>
        </div>
      )}

      {/* Lista a pagar */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-bold text-ink-800">
            <Wallet size={18} className="text-brand-600" /> A pagar agora
          </h2>
          {pending.length > 0 && (
            <button onClick={() => setTab('mes')} className="text-sm font-semibold text-brand-600">
              ver mês →
            </button>
          )}
        </div>

        {pending.length === 0 ? (
          totals.countTotal === 0 ? (
            <EmptyState
              icon={<Sparkles size={26} />}
              title="Nenhuma conta cadastrada ainda"
              subtitle="Comece cadastrando suas contas fixas: aluguel, cartão, financiamento, assinaturas…"
              action={
                <button onClick={() => setShowForm(true)} className="btn-primary px-4 py-2.5">
                  <Plus size={18} /> Cadastrar primeira conta
                </button>
              }
            />
          ) : (
            <EmptyState
              icon={<CheckCircle2 size={26} />}
              title="Nada pendente por aqui"
              subtitle="Todas as contas deste mês já foram pagas ou puladas."
            />
          )
        ) : (
          <div className="space-y-2">
            {pending.map((p) => (
              <PaymentRow key={p.id} payment={p} bill={billsMap.get(p.billId)} />
            ))}
          </div>
        )}
      </section>

      {/* Ações rápidas */}
      {totals.countTotal > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => downloadICS(payments, `contas-${ym}.ics`)}
            className="btn-ghost flex-col gap-1 py-4"
          >
            <CalendarPlus size={20} className="text-brand-600" />
            <span className="text-xs font-semibold">Add ao calendário</span>
          </button>
          <button onClick={() => setTab('relatorios')} className="btn-ghost flex-col gap-1 py-4">
            <TrendingUp size={20} className="text-brand-600" />
            <span className="text-xs font-semibold">Ver relatórios</span>
          </button>
        </div>
      )}

      {showForm && <BillForm open={showForm} onClose={() => setShowForm(false)} />}
    </div>
  )
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: 'amber' | 'rose' | 'emerald'
}) {
  const color = {
    amber: 'text-amber-600',
    rose: 'text-rose-600',
    emerald: 'text-emerald-600',
  }[tone]
  return (
    <div className="px-3 py-3 text-center">
      <p className={`text-2xl font-extrabold ${color}`}>{value}</p>
      <p className="text-xs text-ink-400">{label}</p>
    </div>
  )
}
