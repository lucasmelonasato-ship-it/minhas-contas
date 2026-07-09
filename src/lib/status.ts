import type { Payment } from '../db/db'
import { daysUntil } from './dates'

export type DisplayStatus = 'pago' | 'pendente' | 'atrasado' | 'hoje' | 'pulado'

export function displayStatus(p: Payment): DisplayStatus {
  if (p.skipped) return 'pulado'
  if (p.paid) return 'pago'
  const d = daysUntil(p.dueDate)
  if (d < 0) return 'atrasado'
  if (d === 0) return 'hoje'
  return 'pendente'
}

export interface MonthTotals {
  total: number
  pago: number
  pendente: number
  atrasado: number
  countTotal: number
  countPago: number
  countPendente: number
  countAtrasado: number
}

export function computeTotals(payments: Payment[]): MonthTotals {
  const t: MonthTotals = {
    total: 0,
    pago: 0,
    pendente: 0,
    atrasado: 0,
    countTotal: 0,
    countPago: 0,
    countPendente: 0,
    countAtrasado: 0,
  }
  for (const p of payments) {
    const st = displayStatus(p)
    if (st === 'pulado') continue
    t.total += p.amount
    t.countTotal += 1
    if (st === 'pago') {
      t.pago += p.paidAmount ?? p.amount
      t.countPago += 1
    } else if (st === 'atrasado') {
      t.atrasado += p.amount
      t.countAtrasado += 1
    } else {
      // pendente ou hoje
      t.pendente += p.amount
      t.countPendente += 1
    }
  }
  return t
}
