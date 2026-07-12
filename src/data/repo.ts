import { supabase, RECEIPTS_BUCKET } from '../lib/supabase'
import type { Bill, Payment, Person } from '../db/db'
import { occurrenceFor } from '../lib/occurrences'
import { bumpData } from './store'

// ─────────────────────────────────────────────────────────────────────────────
//  Acesso aos dados no Supabase. Faz o "de-para" entre as colunas do banco
//  (snake_case) e os objetos usados no app (camelCase).
// ─────────────────────────────────────────────────────────────────────────────

/* eslint-disable @typescript-eslint/no-explicit-any */

function unwrap<T>(res: { data: T | null; error: any }): T {
  if (res.error) throw res.error
  return res.data as T
}

let cachedUid: string | undefined
supabase.auth.onAuthStateChange(() => {
  cachedUid = undefined
})
/** ID do usuário logado (lido da sessão local, sem chamada de rede). */
async function currentUid(): Promise<string | undefined> {
  if (cachedUid) return cachedUid
  const { data } = await supabase.auth.getSession()
  cachedUid = data.session?.user.id
  return cachedUid
}

// ─── Mapeamentos ─────────────────────────────────────────────────────────────
function rowToPerson(r: any): Person {
  return { id: r.id, name: r.name, color: r.color, createdAt: r.created_at }
}

function rowToBill(r: any): Bill {
  return {
    id: r.id,
    name: r.name,
    category: r.category,
    type: r.type,
    amount: r.amount,
    frequency: r.frequency ?? undefined,
    dueDay: r.due_day,
    dueMonth: r.due_month ?? undefined,
    dueYear: r.due_year ?? undefined,
    startYear: r.start_year,
    startMonth: r.start_month,
    installmentsTotal: r.installments_total ?? undefined,
    ownerId: r.owner_id ?? undefined,
    autopay: r.autopay,
    notes: r.notes ?? undefined,
    active: r.active,
    createdAt: r.created_at,
  }
}

function billToRow(b: Partial<Bill>): Record<string, any> {
  const row: Record<string, any> = {}
  if (b.name !== undefined) row.name = b.name
  if (b.category !== undefined) row.category = b.category
  if (b.type !== undefined) row.type = b.type
  if (b.amount !== undefined) row.amount = b.amount
  if (b.frequency !== undefined) row.frequency = b.frequency ?? null
  if (b.dueDay !== undefined) row.due_day = b.dueDay
  if (b.dueMonth !== undefined) row.due_month = b.dueMonth ?? null
  if (b.dueYear !== undefined) row.due_year = b.dueYear ?? null
  if (b.startYear !== undefined) row.start_year = b.startYear
  if (b.startMonth !== undefined) row.start_month = b.startMonth
  if (b.installmentsTotal !== undefined) row.installments_total = b.installmentsTotal ?? null
  if (b.ownerId !== undefined) row.owner_id = b.ownerId ?? null
  if (b.autopay !== undefined) row.autopay = b.autopay
  if (b.notes !== undefined) row.notes = b.notes ?? null
  if (b.active !== undefined) row.active = b.active
  return row
}

function rowToPayment(r: any): Payment {
  return {
    id: r.id,
    billId: r.bill_id,
    competencia: r.competencia,
    dueDate: r.due_date,
    amount: r.amount,
    paid: r.paid,
    paidAt: r.paid_at ?? undefined,
    paidAmount: r.paid_amount ?? undefined,
    paidById: r.paid_by_id ?? undefined,
    receiptPath: r.receipt_path ?? undefined,
    installmentNumber: r.installment_number ?? undefined,
    skipped: r.skipped ?? false,
    notes: r.notes ?? undefined,
    createdAt: r.created_at,
  }
}

// ─── Pessoas ─────────────────────────────────────────────────────────────────
export async function getPeople(): Promise<Person[]> {
  const rows = unwrap(await supabase.from('people').select('*').order('created_at'))
  return (rows ?? []).map(rowToPerson)
}

export async function seedPeopleIfEmpty(): Promise<void> {
  const rows = unwrap(await supabase.from('people').select('id').limit(1))
  if (rows && rows.length > 0) return
  unwrap(
    await supabase.from('people').insert([
      { name: 'Lucas', color: '#2563eb' },
      { name: 'Gabi', color: '#db2777' },
    ]),
  )
  bumpData()
}

export async function addPerson(name: string, color: string): Promise<void> {
  unwrap(await supabase.from('people').insert({ name, color }))
  bumpData()
}

export async function updatePerson(id: string, patch: Partial<Person>): Promise<void> {
  const row: Record<string, any> = {}
  if (patch.name !== undefined) row.name = patch.name
  if (patch.color !== undefined) row.color = patch.color
  unwrap(await supabase.from('people').update(row).eq('id', id))
  bumpData()
}

export async function deletePerson(id: string): Promise<void> {
  unwrap(await supabase.from('people').delete().eq('id', id))
  bumpData()
}

// ─── Contas (bills) ──────────────────────────────────────────────────────────
export async function getBills(): Promise<Bill[]> {
  const rows = unwrap(await supabase.from('bills').select('*').order('name'))
  return (rows ?? []).map(rowToBill)
}

export async function addBill(bill: Omit<Bill, 'id' | 'createdAt'>): Promise<Bill> {
  const rows = unwrap(await supabase.from('bills').insert(billToRow(bill)).select('*'))
  bumpData()
  return rowToBill((rows as any[])[0])
}

export async function updateBill(id: string, patch: Partial<Bill>): Promise<void> {
  unwrap(await supabase.from('bills').update(billToRow(patch)).eq('id', id))
  bumpData()
}

export async function deleteBill(id: string): Promise<void> {
  // Remove comprovantes do Storage antes de apagar (os pagamentos caem em cascata).
  const pays = unwrap(
    await supabase.from('payments').select('receipt_path').eq('bill_id', id),
  ) as any[]
  const paths = (pays ?? []).map((p) => p.receipt_path).filter((p): p is string => !!p)
  if (paths.length) await supabase.storage.from(RECEIPTS_BUCKET).remove(paths)
  unwrap(await supabase.from('bills').delete().eq('id', id))
  bumpData()
}

// ─── Pagamentos ──────────────────────────────────────────────────────────────
export async function getMonthPayments(ym: string): Promise<Payment[]> {
  const rows = unwrap(
    await supabase.from('payments').select('*').eq('competencia', ym),
  )
  return (rows ?? []).map(rowToPayment)
}

export async function getAllPayments(): Promise<Payment[]> {
  const rows = unwrap(await supabase.from('payments').select('*'))
  return (rows ?? []).map(rowToPayment)
}

/**
 * Garante que existam ocorrências (payments) das contas ativas no mês.
 * Insere apenas o que ainda não existe; duplicatas são ignoradas pelo banco.
 */
export async function ensureMonthPayments(ym: string): Promise<void> {
  const [bills, existing, userId] = await Promise.all([
    getBills(),
    getMonthPayments(ym),
    currentUid(),
  ])
  const active = bills.filter((b) => b.active)
  const have = new Set(existing.map((p) => p.billId))

  const toInsert: Record<string, any>[] = []
  for (const bill of active) {
    if (have.has(bill.id)) continue
    const occ = occurrenceFor(bill, ym)
    if (!occ) continue
    toInsert.push({
      user_id: userId,
      bill_id: bill.id,
      competencia: ym,
      due_date: occ.dueDate,
      amount: bill.amount,
      installment_number: occ.installmentNumber ?? null,
      paid: false,
    })
  }

  if (toInsert.length) {
    const { error } = await supabase
      .from('payments')
      .upsert(toInsert, { onConflict: 'user_id,bill_id,competencia', ignoreDuplicates: true })
    if (error) console.error('ensureMonthPayments:', error)
    bumpData()
  }
}

export async function updatePaymentAmount(id: string, amount: number): Promise<void> {
  unwrap(await supabase.from('payments').update({ amount }).eq('id', id))
  bumpData()
}

interface MarkPaidInput {
  paidAmount: number
  paidById?: string
  paidAt: string
  notes?: string
  receiptFile?: File | null
}

export async function markPaid(payment: Payment, input: MarkPaidInput): Promise<void> {
  let receiptPath = payment.receiptPath
  if (input.receiptFile) {
    receiptPath = await uploadReceipt(input.receiptFile, payment.id)
  }
  unwrap(
    await supabase
      .from('payments')
      .update({
        paid: true,
        paid_at: input.paidAt,
        paid_amount: input.paidAmount,
        paid_by_id: input.paidById ?? null,
        notes: input.notes ?? null,
        receipt_path: receiptPath ?? null,
        skipped: false,
      })
      .eq('id', payment.id),
  )
  bumpData()
}

export async function undoPaid(id: string): Promise<void> {
  unwrap(
    await supabase
      .from('payments')
      .update({ paid: false, paid_at: null, paid_amount: null, paid_by_id: null })
      .eq('id', id),
  )
  bumpData()
}

export async function skipPayment(id: string): Promise<void> {
  unwrap(await supabase.from('payments').update({ skipped: true, paid: false }).eq('id', id))
  bumpData()
}

export async function unskipPayment(id: string): Promise<void> {
  unwrap(await supabase.from('payments').update({ skipped: false }).eq('id', id))
  bumpData()
}

/** Apaga todas as contas, pagamentos e comprovantes (mantém as pessoas). */
export async function wipeAllData(): Promise<void> {
  const pays = unwrap(await supabase.from('payments').select('receipt_path')) as any[]
  const paths = (pays ?? []).map((p) => p.receipt_path).filter((p): p is string => !!p)
  if (paths.length) await supabase.storage.from(RECEIPTS_BUCKET).remove(paths)
  unwrap(await supabase.from('payments').delete().not('id', 'is', null))
  unwrap(await supabase.from('bills').delete().not('id', 'is', null))
  bumpData()
}

// ─── Comprovantes (Storage) ──────────────────────────────────────────────────
import { processReceiptFile } from '../lib/receipts'

export async function uploadReceipt(file: File, paymentId: string): Promise<string> {
  const blob = await processReceiptFile(file)
  const ext = blob.type.includes('pdf') ? 'pdf' : 'jpg'
  const path = `${paymentId}/${Date.now()}.${ext}`
  const { error } = await supabase.storage
    .from(RECEIPTS_BUCKET)
    .upload(path, blob, { contentType: blob.type || 'application/octet-stream', upsert: true })
  if (error) throw error
  return path
}

export async function attachReceipt(payment: Payment, file: File): Promise<void> {
  if (payment.receiptPath) {
    await supabase.storage.from(RECEIPTS_BUCKET).remove([payment.receiptPath])
  }
  const path = await uploadReceipt(file, payment.id)
  unwrap(await supabase.from('payments').update({ receipt_path: path }).eq('id', payment.id))
  bumpData()
}

export async function receiptSignedUrl(path: string): Promise<string | undefined> {
  const { data, error } = await supabase.storage
    .from(RECEIPTS_BUCKET)
    .createSignedUrl(path, 3600)
  if (error) {
    console.error('receiptSignedUrl:', error)
    return undefined
  }
  return data?.signedUrl
}

export async function downloadReceipt(path: string): Promise<Blob | undefined> {
  const { data, error } = await supabase.storage.from(RECEIPTS_BUCKET).download(path)
  if (error) {
    console.error('downloadReceipt:', error)
    return undefined
  }
  return data ?? undefined
}
