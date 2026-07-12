import { supabase } from './supabase'
import { getBills, getAllPayments, getPeople } from '../data/repo'
import { bumpData } from '../data/store'
import type { Bill, Payment, Person } from '../db/db'

// Backup dos dados (pessoas, contas e pagamentos) em JSON. Os comprovantes em si
// ficam guardados com segurança na nuvem (Storage) e não vão no arquivo.

/* eslint-disable @typescript-eslint/no-explicit-any */

interface BackupFile {
  app: 'minhas-contas'
  version: number
  exportedAt: string
  people: Person[]
  bills: Bill[]
  payments: Payment[]
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

export async function exportBackup(): Promise<void> {
  const [people, bills, payments] = await Promise.all([
    getPeople(),
    getBills(),
    getAllPayments(),
  ])
  const data: BackupFile = {
    app: 'minhas-contas',
    version: 2,
    exportedAt: new Date().toISOString(),
    people,
    bills,
    payments,
  }
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' })
  triggerDownload(blob, `backup-minhas-contas-${new Date().toISOString().slice(0, 10)}.json`)
}

export async function importBackup(file: File): Promise<void> {
  const data = JSON.parse(await file.text()) as BackupFile
  if (data.app !== 'minhas-contas') throw new Error('Arquivo de backup inválido.')

  const peopleRows = (data.people ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    color: p.color,
  }))
  const billRows = (data.bills ?? []).map((b) => ({
    id: b.id,
    name: b.name,
    category: b.category,
    type: b.type,
    amount: b.amount,
    frequency: b.frequency ?? null,
    due_day: b.dueDay,
    due_month: b.dueMonth ?? null,
    due_year: b.dueYear ?? null,
    start_year: b.startYear,
    start_month: b.startMonth,
    installments_total: b.installmentsTotal ?? null,
    owner_id: b.ownerId ?? null,
    autopay: b.autopay,
    notes: b.notes ?? null,
    active: b.active,
  }))
  const paymentRows = (data.payments ?? []).map((p) => ({
    id: p.id,
    bill_id: p.billId,
    competencia: p.competencia,
    due_date: p.dueDate,
    amount: p.amount,
    paid: p.paid,
    paid_at: p.paidAt ?? null,
    paid_amount: p.paidAmount ?? null,
    paid_by_id: p.paidById ?? null,
    receipt_path: p.receiptPath ?? null,
    installment_number: p.installmentNumber ?? null,
    skipped: p.skipped ?? false,
    notes: p.notes ?? null,
  }))

  if (peopleRows.length) {
    const { error } = await supabase.from('people').upsert(peopleRows)
    if (error) throw error
  }
  if (billRows.length) {
    const { error } = await supabase.from('bills').upsert(billRows)
    if (error) throw error
  }
  if (paymentRows.length) {
    const { error } = await supabase.from('payments').upsert(paymentRows)
    if (error) throw error
  }
  bumpData()
}
