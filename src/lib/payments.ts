import { db, type Payment } from '../db/db'
import { processReceiptFile } from './receipts'

interface MarkPaidInput {
  paidAmount: number
  paidById?: number
  paidAt: string
  notes?: string
  receiptFile?: File | null
}

/** Marca uma ocorrência como paga, opcionalmente anexando o comprovante. */
export async function markPaid(paymentId: number, input: MarkPaidInput): Promise<void> {
  let receiptId: number | undefined
  if (input.receiptFile) {
    const blob = await processReceiptFile(input.receiptFile)
    receiptId = await db.receipts.add({
      paymentId,
      blob,
      filename: input.receiptFile.name,
      mime: blob.type || input.receiptFile.type || 'application/octet-stream',
      createdAt: new Date().toISOString(),
    })
  }
  await db.payments.update(paymentId, {
    paid: true,
    paidAt: input.paidAt,
    paidAmount: input.paidAmount,
    paidById: input.paidById,
    notes: input.notes,
    ...(receiptId != null ? { receiptId } : {}),
    skipped: false,
  })
}

/** Desfaz o pagamento (mantém o comprovante anexado, se houver). */
export async function undoPaid(paymentId: number): Promise<void> {
  await db.payments.update(paymentId, {
    paid: false,
    paidAt: undefined,
    paidAmount: undefined,
    paidById: undefined,
  })
}

/** Anexa/atualiza o comprovante de um pagamento já existente. */
export async function attachReceipt(paymentId: number, file: File): Promise<void> {
  const payment = await db.payments.get(paymentId)
  if (!payment) return
  if (payment.receiptId != null) {
    await db.receipts.delete(payment.receiptId)
  }
  const blob = await processReceiptFile(file)
  const receiptId = await db.receipts.add({
    paymentId,
    blob,
    filename: file.name,
    mime: blob.type || file.type || 'application/octet-stream',
    createdAt: new Date().toISOString(),
  })
  await db.payments.update(paymentId, { receiptId })
}

export async function removeReceipt(payment: Payment): Promise<void> {
  if (payment.receiptId != null) {
    await db.receipts.delete(payment.receiptId)
    await db.payments.update(payment.id!, { receiptId: undefined })
  }
}

/** Pula a ocorrência no mês (não conta como pagar nem como pendente). */
export async function skipPayment(paymentId: number): Promise<void> {
  await db.payments.update(paymentId, { skipped: true, paid: false })
}

export async function unskipPayment(paymentId: number): Promise<void> {
  await db.payments.update(paymentId, { skipped: false })
}

/** Ajusta o valor planejado de uma ocorrência específica (ex.: fatura variável). */
export async function updatePaymentAmount(paymentId: number, amount: number): Promise<void> {
  await db.payments.update(paymentId, { amount })
}
