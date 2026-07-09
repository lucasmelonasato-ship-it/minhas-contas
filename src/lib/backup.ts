import { db, type Receipt } from '../db/db'
import { triggerDownload } from './ics'

// Backup completo em JSON. Como os comprovantes são imagens (Blob), eles são
// convertidos para base64 na exportação e reconstruídos na importação.

interface ReceiptExport extends Omit<Receipt, 'blob'> {
  blobBase64: string
}

interface BackupFile {
  app: 'minhas-contas'
  version: number
  exportedAt: string
  people: unknown[]
  bills: unknown[]
  payments: unknown[]
  receipts: ReceiptExport[]
  settings: unknown[]
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '')
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

function base64ToBlob(base64: string, mime: string): Blob {
  const bin = atob(base64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return new Blob([bytes], { type: mime })
}

export async function exportBackup(): Promise<void> {
  const [people, bills, payments, receipts, settings] = await Promise.all([
    db.people.toArray(),
    db.bills.toArray(),
    db.payments.toArray(),
    db.receipts.toArray(),
    db.settings.toArray(),
  ])

  const receiptsExport: ReceiptExport[] = await Promise.all(
    receipts.map(async (r) => {
      const { blob, ...rest } = r
      return { ...rest, blobBase64: await blobToBase64(blob) }
    }),
  )

  const data: BackupFile = {
    app: 'minhas-contas',
    version: 1,
    exportedAt: new Date().toISOString(),
    people,
    bills,
    payments,
    receipts: receiptsExport,
    settings,
  }

  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' })
  const stamp = new Date().toISOString().slice(0, 10)
  triggerDownload(blob, `backup-minhas-contas-${stamp}.json`)
}

/** Substitui todos os dados pelo conteúdo do backup. */
export async function importBackup(file: File): Promise<void> {
  const text = await file.text()
  const data = JSON.parse(text) as BackupFile
  if (data.app !== 'minhas-contas') {
    throw new Error('Arquivo de backup inválido.')
  }

  const receipts: Receipt[] = (data.receipts ?? []).map((r) => {
    const { blobBase64, ...rest } = r
    return { ...rest, blob: base64ToBlob(blobBase64, rest.mime) }
  })

  await db.transaction(
    'rw',
    db.people,
    db.bills,
    db.payments,
    db.receipts,
    db.settings,
    async () => {
      await Promise.all([
        db.people.clear(),
        db.bills.clear(),
        db.payments.clear(),
        db.receipts.clear(),
        db.settings.clear(),
      ])
      await db.people.bulkAdd(data.people as never[])
      await db.bills.bulkAdd(data.bills as never[])
      await db.payments.bulkAdd(data.payments as never[])
      if (receipts.length) await db.receipts.bulkAdd(receipts as never[])
      await db.settings.bulkAdd((data.settings ?? []) as never[])
    },
  )
}
