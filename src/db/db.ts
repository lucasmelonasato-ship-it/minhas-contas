import Dexie, { type Table } from 'dexie'

// ─────────────────────────────────────────────────────────────────────────────
//  Modelo de dados — tudo fica no aparelho (IndexedDB). Nada é enviado a servidor.
//  Valores monetários são sempre guardados em CENTAVOS (inteiro) para evitar
//  erros de arredondamento de ponto flutuante.
// ─────────────────────────────────────────────────────────────────────────────

export type Frequency = 'mensal' | 'anual'
export type BillType = 'recorrente' | 'parcelado' | 'avulsa'

export type CategoryKey =
  | 'moradia'
  | 'transporte'
  | 'cartao'
  | 'financiamento'
  | 'assinatura'
  | 'utilidades'
  | 'saude'
  | 'educacao'
  | 'lazer'
  | 'impostos'
  | 'outros'

export interface Person {
  id?: number
  name: string
  color: string
  createdAt: string
}

export interface Bill {
  id?: number
  name: string
  category: CategoryKey
  type: BillType
  /** Valor da parcela / mensalidade / valor estimado, em centavos */
  amount: number
  /** Apenas para type = recorrente */
  frequency?: Frequency
  /** Dia do vencimento (1–31). Ajustado ao último dia se o mês for mais curto. */
  dueDay: number
  /** Mês do vencimento (1–12) — usado em recorrente anual e avulsa */
  dueMonth?: number
  /** Ano do vencimento — usado em avulsa */
  dueYear?: number
  /** A partir de quando a conta passa a valer */
  startYear: number
  startMonth: number
  /** Quantidade total de parcelas — apenas para type = parcelado */
  installmentsTotal?: number
  /** Pessoa responsável pela conta */
  ownerId?: number
  /** Débito automático / pagamento automático */
  autopay: boolean
  notes?: string
  active: boolean
  createdAt: string
}

export interface Payment {
  id?: number
  billId: number
  /** Competência no formato 'YYYY-MM' */
  competencia: string
  /** Data de vencimento 'YYYY-MM-DD' */
  dueDate: string
  /** Valor planejado (centavos) */
  amount: number
  paid: boolean
  paidAt?: string
  /** Valor efetivamente pago (centavos) */
  paidAmount?: number
  paidById?: number
  receiptId?: number
  /** Número da parcela (parcelado) */
  installmentNumber?: number
  /** Usuário optou por pular esta ocorrência no mês */
  skipped?: boolean
  notes?: string
  createdAt: string
}

export interface Receipt {
  id?: number
  paymentId?: number
  blob: Blob
  filename: string
  mime: string
  createdAt: string
}

export interface Setting {
  key: string
  value: unknown
}

export class MinhasContasDB extends Dexie {
  people!: Table<Person, number>
  bills!: Table<Bill, number>
  payments!: Table<Payment, number>
  receipts!: Table<Receipt, number>
  settings!: Table<Setting, string>

  constructor() {
    super('minhas-contas')
    this.version(1).stores({
      people: '++id, name',
      bills: '++id, name, category, type, active, ownerId',
      payments: '++id, billId, competencia, paid, dueDate, [billId+competencia]',
      receipts: '++id, paymentId',
      settings: 'key',
    })
  }
}

export const db = new MinhasContasDB()

/** Cria as pessoas padrão (Eu / Namorada) na primeira execução. */
export async function ensureSeed(): Promise<void> {
  const count = await db.people.count()
  if (count === 0) {
    const now = new Date().toISOString()
    await db.people.bulkAdd([
      { name: 'Lucas', color: '#2563eb', createdAt: now },
      { name: 'Gabi', color: '#db2777', createdAt: now },
    ])
  }
}
