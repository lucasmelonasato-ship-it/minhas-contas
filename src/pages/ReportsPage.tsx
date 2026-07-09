import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from 'recharts'
import { BarChart3, PieChart as PieIcon, Users } from 'lucide-react'
import { db, type Payment } from '../db/db'
import { useApp } from '../AppContext'
import { useBillsMap } from '../hooks'
import { MonthSwitcher } from '../components/MonthSwitcher'
import { EmptyState } from '../components/ui'
import { categoryMeta } from '../lib/categories'
import { addMonthsYM } from '../lib/dates'
import { formatBRL, formatMonthShort } from '../lib/format'

function compactBRL(cents: number): string {
  const v = cents / 100
  if (v >= 1000) return `R$${(v / 1000).toFixed(1)}k`
  return `R$${v.toFixed(0)}`
}

export default function ReportsPage() {
  const { ym } = useApp()
  const allPayments = useLiveQuery(() => db.payments.toArray(), [], [] as Payment[])
  const billsMap = useBillsMap()
  const people = useLiveQuery(() => db.people.toArray(), [], [])

  // Evolução dos últimos 6 meses (ancorado no mês selecionado)
  const monthly = useMemo(() => {
    const months: string[] = []
    for (let i = 5; i >= 0; i--) months.push(addMonthsYM(ym, -i))
    return months.map((m) => {
      const items = allPayments.filter((p) => p.competencia === m && !p.skipped)
      const total = items.reduce((s, p) => s + p.amount, 0)
      const pago = items
        .filter((p) => p.paid)
        .reduce((s, p) => s + (p.paidAmount ?? p.amount), 0)
      return { mes: formatMonthShort(m), total: total / 100, pago: pago / 100, totalCents: total }
    })
  }, [allPayments, ym])

  // Gastos por categoria no mês selecionado
  const byCategory = useMemo(() => {
    const map = new Map<string, number>()
    for (const p of allPayments) {
      if (p.competencia !== ym || p.skipped) continue
      const bill = billsMap.get(p.billId)
      const key = bill?.category ?? 'outros'
      map.set(key, (map.get(key) ?? 0) + p.amount)
    }
    return Array.from(map.entries())
      .map(([key, cents]) => ({
        key,
        name: categoryMeta(key as never).label,
        color: categoryMeta(key as never).color,
        value: cents / 100,
        cents,
      }))
      .sort((a, b) => b.cents - a.cents)
  }, [allPayments, billsMap, ym])

  // Por pessoa no mês selecionado
  const byPerson = useMemo(() => {
    const map = new Map<number | 'none', number>()
    for (const p of allPayments) {
      if (p.competencia !== ym || p.skipped) continue
      const owner = billsMap.get(p.billId)?.ownerId ?? 'none'
      map.set(owner, (map.get(owner) ?? 0) + p.amount)
    }
    return Array.from(map.entries()).map(([owner, cents]) => {
      const person = owner === 'none' ? undefined : people.find((pp) => pp.id === owner)
      return {
        name: person?.name ?? 'Sem responsável',
        color: person?.color ?? '#94a3b8',
        cents,
      }
    })
  }, [allPayments, billsMap, people, ym])

  const monthTotalCents = byCategory.reduce((s, c) => s + c.cents, 0)
  const paidThisYear = useMemo(() => {
    const year = ym.slice(0, 4)
    return allPayments
      .filter((p) => p.paid && p.competencia.startsWith(year))
      .reduce((s, p) => s + (p.paidAmount ?? p.amount), 0)
  }, [allPayments, ym])

  const hasData = allPayments.some((p) => !p.skipped)

  return (
    <div className="space-y-5">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-ink-900">
          <BarChart3 size={24} className="text-brand-600" /> Relatórios
        </h1>
        <p className="text-sm text-ink-400">Para onde vai o seu dinheiro</p>
      </header>

      <MonthSwitcher />

      {!hasData ? (
        <EmptyState
          icon={<BarChart3 size={26} />}
          title="Sem dados ainda"
          subtitle="Cadastre contas e registre pagamentos para ver seus relatórios."
        />
      ) : (
        <>
          {/* Totais do ano */}
          <div className="grid grid-cols-2 gap-3">
            <div className="card px-4 py-3">
              <p className="text-xs text-ink-400">Total deste mês</p>
              <p className="text-xl font-extrabold text-ink-900">{formatBRL(monthTotalCents)}</p>
            </div>
            <div className="card px-4 py-3">
              <p className="text-xs text-ink-400">Pago em {ym.slice(0, 4)}</p>
              <p className="text-xl font-extrabold text-emerald-600">{formatBRL(paidThisYear)}</p>
            </div>
          </div>

          {/* Evolução mensal */}
          <div className="card px-4 py-4">
            <h2 className="mb-3 flex items-center gap-2 font-bold text-ink-800">
              <BarChart3 size={18} className="text-brand-600" /> Últimos 6 meses
            </h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthly} margin={{ top: 6, right: 4, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f7" />
                <XAxis dataKey="mes" tick={{ fontSize: 12, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`)}
                />
                <Tooltip
                  formatter={(v: number) => formatBRL(Math.round(v * 100))}
                  labelStyle={{ color: '#0f172a', fontWeight: 600 }}
                  contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13 }}
                />
                <Bar dataKey="total" name="Previsto" fill="#bfdbfe" radius={[6, 6, 0, 0]} />
                <Bar dataKey="pago" name="Pago" fill="#2563eb" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-2 flex justify-center gap-5 text-xs text-ink-500">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-brand-200" /> Previsto
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-brand-600" /> Pago
              </span>
            </div>
          </div>

          {/* Por categoria */}
          <div className="card px-4 py-4">
            <h2 className="mb-3 flex items-center gap-2 font-bold text-ink-800">
              <PieIcon size={18} className="text-brand-600" /> Por categoria
            </h2>
            <div className="flex flex-col items-center gap-4 sm:flex-row">
              <ResponsiveContainer width="100%" height={180} className="max-w-[200px]">
                <PieChart>
                  <Pie
                    data={byCategory}
                    dataKey="cents"
                    nameKey="name"
                    innerRadius={45}
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {byCategory.map((c) => (
                      <Cell key={c.key} fill={c.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatBRL(v)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="w-full flex-1 space-y-1.5">
                {byCategory.map((c) => (
                  <div key={c.key} className="flex items-center gap-2 text-sm">
                    <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: c.color }} />
                    <span className="flex-1 truncate text-ink-600">{c.name}</span>
                    <span className="font-semibold tabular-nums text-ink-900">
                      {formatBRL(c.cents)}
                    </span>
                    <span className="w-10 text-right text-xs text-ink-400">
                      {monthTotalCents > 0 ? Math.round((c.cents / monthTotalCents) * 100) : 0}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Por pessoa */}
          {byPerson.length > 0 && (
            <div className="card px-4 py-4">
              <h2 className="mb-3 flex items-center gap-2 font-bold text-ink-800">
                <Users size={18} className="text-brand-600" /> Por pessoa
              </h2>
              <div className="space-y-3">
                {byPerson.map((p) => (
                  <div key={p.name}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="font-medium text-ink-700">{p.name}</span>
                      <span className="font-semibold tabular-nums text-ink-900">
                        {formatBRL(p.cents)}
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-ink-100">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${monthTotalCents > 0 ? (p.cents / monthTotalCents) * 100 : 0}%`,
                          background: p.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="pb-2 text-center text-xs text-ink-300">
            Valores previstos do mês · {compactBRL(monthTotalCents)} no total
          </p>
        </>
      )}
    </div>
  )
}
