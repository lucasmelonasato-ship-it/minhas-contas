import type { Bill, Payment, Person } from './db/db'
import { useQuery } from './data/store'
import { getBills, getMonthPayments, getPeople, getAllPayments } from './data/repo'

/** Todas as contas cadastradas (ordenadas por nome). */
export function useBills(): Bill[] {
  return useQuery(() => getBills(), [], [] as Bill[])
}

/** Mapa id -> Bill. */
export function useBillsMap(): Map<string, Bill> {
  const bills = useBills()
  return new Map(bills.map((b) => [b.id, b]))
}

/** Pagamentos (ocorrências) de uma competência 'YYYY-MM'. */
export function useMonthPayments(ym: string): Payment[] {
  return useQuery(() => getMonthPayments(ym), [ym], [] as Payment[])
}

/** Todos os pagamentos (para relatórios). */
export function useAllPayments(): Payment[] {
  return useQuery(() => getAllPayments(), [], [] as Payment[])
}

/** Pessoas (Lucas, Gabi, …). */
export function usePeople(): Person[] {
  return useQuery(() => getPeople(), [], [] as Person[])
}
