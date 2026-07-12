import { useMemo, useState } from 'react'
import { ListChecks, Plus, Pencil, Trash2, Power, Zap } from 'lucide-react'
import { type Bill } from '../db/db'
import { useBills } from '../hooks'
import { deleteBill, updateBill } from '../data/repo'
import { BillForm } from '../components/BillForm'
import { CategoryChip } from '../components/CategoryIcon'
import { EmptyState } from '../components/ui'
import { categoryMeta } from '../lib/categories'
import { formatBRL } from '../lib/format'

function typeLabel(bill: Bill): string {
  if (bill.type === 'parcelado') return `${bill.installmentsTotal}x parcelado`
  if (bill.type === 'avulsa') return 'Avulsa'
  return bill.frequency === 'anual' ? 'Anual' : 'Mensal'
}

export default function BillsPage() {
  const bills = useBills()
  const [editing, setEditing] = useState<Bill | undefined>()
  const [showForm, setShowForm] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<Bill | null>(null)

  const monthlyFixed = useMemo(
    () =>
      bills
        .filter((b) => b.active && b.type === 'recorrente' && b.frequency === 'mensal')
        .reduce((s, b) => s + b.amount, 0),
    [bills],
  )
  const openInstallments = useMemo(
    () => bills.filter((b) => b.active && b.type === 'parcelado').length,
    [bills],
  )

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-ink-900">
          <ListChecks size={24} className="text-brand-600" /> Minhas contas
        </h1>
        <button
          onClick={() => {
            setEditing(undefined)
            setShowForm(true)
          }}
          className="btn-primary px-3.5 py-2.5"
        >
          <Plus size={18} /> Nova
        </button>
      </header>

      {bills.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <div className="card px-4 py-3">
            <p className="text-xs text-ink-400">Fixo mensal</p>
            <p className="text-xl font-extrabold text-ink-900">{formatBRL(monthlyFixed)}</p>
          </div>
          <div className="card px-4 py-3">
            <p className="text-xs text-ink-400">Financiamentos ativos</p>
            <p className="text-xl font-extrabold text-ink-900">{openInstallments}</p>
          </div>
        </div>
      )}

      {bills.length === 0 ? (
        <EmptyState
          icon={<ListChecks size={26} />}
          title="Cadastre suas contas"
          subtitle="Aqui ficam todas as suas contas fixas. O app vai gerar automaticamente o que vence a cada mês."
          action={
            <button
              onClick={() => {
                setEditing(undefined)
                setShowForm(true)
              }}
              className="btn-primary px-4 py-2.5"
            >
              <Plus size={18} /> Cadastrar conta
            </button>
          }
        />
      ) : (
        <div className="space-y-2">
          {bills.map((bill) => {
            const meta = categoryMeta(bill.category)
            return (
              <div
                key={bill.id}
                className={`flex items-center gap-3 rounded-2xl bg-white px-3.5 py-3 shadow-card ${
                  bill.active ? '' : 'opacity-55'
                }`}
              >
                <CategoryChip category={bill.category} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-semibold text-ink-900">{bill.name}</p>
                    {bill.autopay && (
                      <span className="flex items-center gap-0.5 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600">
                        <Zap size={10} /> auto
                      </span>
                    )}
                  </div>
                  <p className="truncate text-xs text-ink-400">
                    {meta.label} · {typeLabel(bill)} · vence dia {bill.dueDay}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <span className="font-bold tabular-nums text-ink-900">
                    {formatBRL(bill.amount)}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateBill(bill.id, { active: !bill.active })}
                      className="rounded-lg p-1.5 text-ink-300 hover:bg-ink-100 hover:text-ink-600"
                      title={bill.active ? 'Desativar' : 'Ativar'}
                    >
                      <Power size={16} />
                    </button>
                    <button
                      onClick={() => {
                        setEditing(bill)
                        setShowForm(true)
                      }}
                      className="rounded-lg p-1.5 text-ink-300 hover:bg-ink-100 hover:text-brand-600"
                      title="Editar"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => setConfirmDelete(bill)}
                      className="rounded-lg p-1.5 text-ink-300 hover:bg-ink-100 hover:text-rose-600"
                      title="Excluir"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showForm && (
        <BillForm open={showForm} onClose={() => setShowForm(false)} bill={editing} />
      )}

      {/* Confirmação de exclusão */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-ink-900/40"
            onClick={() => setConfirmDelete(null)}
          />
          <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white p-5 shadow-soft">
            <h3 className="text-lg font-bold text-ink-900">Excluir conta?</h3>
            <p className="mt-1 text-sm text-ink-500">
              "{confirmDelete.name}" e todo o histórico de pagamentos e comprovantes dela serão
              apagados. Não dá para desfazer.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setConfirmDelete(null)}
                className="btn-ghost flex-1 py-2.5"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  await deleteBill(confirmDelete.id)
                  setConfirmDelete(null)
                }}
                className="btn-danger flex-1 py-2.5"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
