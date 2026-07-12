import type { Bill } from '../db/db'
import { buildDueDate, monthsBetween, parseYM } from './dates'

// ─────────────────────────────────────────────────────────────────────────────
//  Lógica pura de ocorrências: dada uma conta e um mês, calcula se ela incide
//  e qual o vencimento. A materialização (gravar no banco) fica em data/repo.ts.
// ─────────────────────────────────────────────────────────────────────────────

interface Occurrence {
  dueDate: string
  installmentNumber?: number
}

type OccInput = Omit<Bill, 'id' | 'createdAt'>

export function occurrenceFor(bill: OccInput, ym: string): Occurrence | null {
  const { year, month } = parseYM(ym)
  const startDiff = monthsBetween(bill.startYear, bill.startMonth, year, month)
  if (startDiff < 0) return null

  if (bill.type === 'recorrente') {
    if (bill.frequency === 'anual') {
      const anniversaryMonth = bill.dueMonth ?? bill.startMonth
      if (month !== anniversaryMonth) return null
      return { dueDate: buildDueDate(year, month, bill.dueDay) }
    }
    return { dueDate: buildDueDate(year, month, bill.dueDay) }
  }

  if (bill.type === 'parcelado') {
    const total = bill.installmentsTotal ?? 1
    if (startDiff >= total) return null
    return {
      dueDate: buildDueDate(year, month, bill.dueDay),
      installmentNumber: startDiff + 1,
    }
  }

  if (bill.type === 'avulsa') {
    if (bill.dueYear === year && bill.dueMonth === month) {
      return { dueDate: buildDueDate(year, month, bill.dueDay) }
    }
    return null
  }

  return null
}

/** Prévia (sem gravar) das próximas N ocorrências — usada no cadastro. */
export function previewOccurrences(
  bill: OccInput,
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
