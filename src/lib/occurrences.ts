import { db, type Bill, type Payment } from '../db/db'
import { buildDueDate, monthsBetween, parseYM } from './dates'

// ─────────────────────────────────────────────────────────────────────────────
//  A partir das contas cadastradas (Bill), materializamos as ocorrências de
//  pagamento (Payment) de um determinado mês sob demanda. Assim o usuário só
//  cadastra a conta uma vez e o app gera automaticamente o que vence em cada mês.
// ─────────────────────────────────────────────────────────────────────────────

interface Occurrence {
  dueDate: string
  installmentNumber?: number
}

/**
 * Decide se uma conta possui ocorrência no mês informado e devolve os dados
 * do vencimento. Retorna null quando a conta não incide naquele mês.
 */
export function occurrenceFor(bill: Bill, ym: string): Occurrence | null {
  const { year, month } = parseYM(ym)
  const startDiff = monthsBetween(bill.startYear, bill.startMonth, year, month)
  if (startDiff < 0) return null // mês anterior ao início da conta

  if (bill.type === 'recorrente') {
    if (bill.frequency === 'anual') {
      const anniversaryMonth = bill.dueMonth ?? bill.startMonth
      if (month !== anniversaryMonth) return null
      return { dueDate: buildDueDate(year, month, bill.dueDay) }
    }
    // mensal (padrão)
    return { dueDate: buildDueDate(year, month, bill.dueDay) }
  }

  if (bill.type === 'parcelado') {
    const total = bill.installmentsTotal ?? 1
    if (startDiff >= total) return null // já quitado
    return {
      dueDate: buildDueDate(year, month, bill.dueDay),
      installmentNumber: startDiff + 1,
    }
  }

  // avulsa — ocorre uma única vez no mês/ano definido
  if (bill.type === 'avulsa') {
    if (bill.dueYear === year && bill.dueMonth === month) {
      return { dueDate: buildDueDate(year, month, bill.dueDay) }
    }
    return null
  }

  return null
}

/**
 * Garante que existam registros de Payment para todas as contas ativas com
 * ocorrência no mês. Não recria pagamentos já existentes (pagos, pulados ou
 * pendentes) — assim o estado que o usuário definiu é preservado.
 */
export async function ensureMonth(ym: string): Promise<void> {
  // Booleanos não são bem indexáveis no IndexedDB; filtramos em memória.
  const active = (await db.bills.toArray()).filter((b) => b.active)

  const existing = await db.payments.where('competencia').equals(ym).toArray()
  const existingByBill = new Set(existing.map((p) => p.billId))

  const toCreate: Payment[] = []
  const now = new Date().toISOString()

  for (const bill of active) {
    if (bill.id == null) continue
    if (existingByBill.has(bill.id)) continue
    const occ = occurrenceFor(bill, ym)
    if (!occ) continue
    toCreate.push({
      billId: bill.id,
      competencia: ym,
      dueDate: occ.dueDate,
      amount: bill.amount,
      paid: false,
      installmentNumber: occ.installmentNumber,
      createdAt: now,
    })
  }

  if (toCreate.length) {
    await db.payments.bulkAdd(toCreate)
  }
}

/**
 * Gera (sem persistir) uma prévia das próximas N ocorrências de uma conta —
 * útil na tela de cadastro para o usuário conferir o que será lançado.
 */
export function previewOccurrences(
  bill: Bill,
  fromYM: string,
  count = 6,
): { ym: string; dueDate: string; installmentNumber?: number }[] {
  const out: { ym: string; dueDate: string; installmentNumber?: number }[] = []
  let { year, month } = parseYM(fromYM)
  let guard = 0
  while (out.length < count && guard < 240) {
    const ym = `${year}-${String(month).padStart(2, '0')}`
    const occ = occurrenceFor(bill, ym)
    if (occ) out.push({ ym, dueDate: occ.dueDate, installmentNumber: occ.installmentNumber })
    month += 1
    if (month > 12) {
      month = 1
      year += 1
    }
    guard += 1
  }
  return out
}
