// ─────────────────────────────────────────────────────────────────────────────
//  Modelo de dados (tipos de domínio).
//  Os dados agora vivem no Supabase (nuvem) e são compartilhados entre as
//  pessoas que entram com o mesmo login. Valores monetários em CENTAVOS (inteiro).
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
  id: string
  name: string
  color: string
  createdAt: string
}

export interface Bill {
  id: string
  name: string
  category: CategoryKey
  type: BillType
  /** Valor da parcela / mensalidade / valor estimado, em centavos */
  amount: number
  frequency?: Frequency
  dueDay: number
  dueMonth?: number
  dueYear?: number
  startYear: number
  startMonth: number
  installmentsTotal?: number
  ownerId?: string
  autopay: boolean
  notes?: string
  active: boolean
  createdAt: string
}

export interface Payment {
  id: string
  billId: string
  /** Competência 'YYYY-MM' */
  competencia: string
  /** Vencimento 'YYYY-MM-DD' */
  dueDate: string
  amount: number
  paid: boolean
  paidAt?: string
  paidAmount?: number
  paidById?: string
  /** Caminho do comprovante no Storage (bucket comprovantes) */
  receiptPath?: string
  installmentNumber?: number
  skipped?: boolean
  notes?: string
  createdAt: string
}
