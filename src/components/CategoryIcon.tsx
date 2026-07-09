import {
  Home,
  Car,
  CreditCard,
  Landmark,
  Repeat,
  Zap,
  HeartPulse,
  GraduationCap,
  PartyPopper,
  ReceiptText,
  Wallet,
  type LucideProps,
} from 'lucide-react'
import type { CategoryKey } from '../db/db'
import { categoryMeta } from '../lib/categories'

const ICONS: Record<string, React.ComponentType<LucideProps>> = {
  Home,
  Car,
  CreditCard,
  Landmark,
  Repeat,
  Zap,
  HeartPulse,
  GraduationCap,
  PartyPopper,
  ReceiptText,
  Wallet,
}

export function CategoryIcon({
  category,
  size = 20,
  className,
}: {
  category: CategoryKey
  size?: number
  className?: string
}) {
  const meta = categoryMeta(category)
  const Cmp = ICONS[meta.icon] ?? Wallet
  return <Cmp size={size} className={className} />
}

/** Ícone dentro de um quadrado colorido com a cor da categoria. */
export function CategoryChip({ category, size = 40 }: { category: CategoryKey; size?: number }) {
  const meta = categoryMeta(category)
  return (
    <div
      className="grid shrink-0 place-items-center rounded-xl"
      style={{
        width: size,
        height: size,
        backgroundColor: `${meta.color}18`,
        color: meta.color,
      }}
    >
      <CategoryIcon category={category} size={size * 0.5} />
    </div>
  )
}
