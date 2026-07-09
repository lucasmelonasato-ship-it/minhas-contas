import type { CategoryKey } from '../db/db'

export interface CategoryMeta {
  key: CategoryKey
  label: string
  /** Nome do ícone lucide-react */
  icon: string
  /** Cor base (hex) para gráficos e destaques */
  color: string
}

export const CATEGORIES: CategoryMeta[] = [
  { key: 'moradia', label: 'Moradia', icon: 'Home', color: '#2563eb' },
  { key: 'transporte', label: 'Transporte', icon: 'Car', color: '#0891b2' },
  { key: 'cartao', label: 'Cartão de crédito', icon: 'CreditCard', color: '#7c3aed' },
  { key: 'financiamento', label: 'Financiamento', icon: 'Landmark', color: '#c026d3' },
  { key: 'assinatura', label: 'Assinaturas', icon: 'Repeat', color: '#db2777' },
  { key: 'utilidades', label: 'Água / Luz / Internet', icon: 'Zap', color: '#ea580c' },
  { key: 'saude', label: 'Saúde', icon: 'HeartPulse', color: '#16a34a' },
  { key: 'educacao', label: 'Educação', icon: 'GraduationCap', color: '#0d9488' },
  { key: 'lazer', label: 'Lazer', icon: 'PartyPopper', color: '#f59e0b' },
  { key: 'impostos', label: 'Impostos / Taxas', icon: 'ReceiptText', color: '#64748b' },
  { key: 'outros', label: 'Outros', icon: 'Wallet', color: '#475569' },
]

const CATEGORY_MAP: Record<CategoryKey, CategoryMeta> = CATEGORIES.reduce(
  (acc, c) => {
    acc[c.key] = c
    return acc
  },
  {} as Record<CategoryKey, CategoryMeta>,
)

export function categoryMeta(key: CategoryKey): CategoryMeta {
  return CATEGORY_MAP[key] ?? CATEGORY_MAP.outros
}
