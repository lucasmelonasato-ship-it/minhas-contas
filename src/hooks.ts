import { useLiveQuery } from 'dexie-react-hooks'
import { db, type Bill, type Payment } from './db/db'

/** Mapa id -> Bill, sempre atualizado. */
export function useBillsMap(): Map<number, Bill> {
  const bills = useLiveQuery(() => db.bills.toArray(), [], [] as Bill[])
  return new Map(bills.filter((b) => b.id != null).map((b) => [b.id as number, b]))
}

/** Pagamentos (ocorrências) de uma competência 'YYYY-MM'. */
export function useMonthPayments(ym: string): Payment[] {
  return (
    useLiveQuery(
      () => db.payments.where('competencia').equals(ym).toArray(),
      [ym],
      [] as Payment[],
    ) ?? []
  )
}

/** Todas as contas cadastradas. */
export function useBills(): Bill[] {
  return useLiveQuery(() => db.bills.orderBy('name').toArray(), [], [] as Bill[]) ?? []
}
