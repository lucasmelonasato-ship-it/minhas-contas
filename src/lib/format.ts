import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

/** Formata centavos como moeda brasileira: 123456 -> "R$ 1.234,56" */
export function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

/** Versão compacta sem o símbolo, útil em inputs: 123456 -> "1.234,56" */
export function centsToInput(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

/** Converte texto digitado ("1.234,56", "1234.56", "1234,5") em centavos. */
export function parseToCents(input: string): number {
  if (!input) return 0
  let s = String(input).trim().replace(/[R$\s]/g, '')
  if (s === '') return 0
  const hasComma = s.includes(',')
  const hasDot = s.includes('.')
  if (hasComma && hasDot) {
    // formato brasileiro: ponto = milhar, vírgula = decimal
    s = s.replace(/\./g, '').replace(',', '.')
  } else if (hasComma) {
    s = s.replace(',', '.')
  }
  const value = Number(s)
  if (Number.isNaN(value)) return 0
  return Math.round(value * 100)
}

/** 'YYYY-MM-DD' -> "09 jul" */
export function formatDayMonth(iso: string): string {
  return format(parseISO(iso), "dd MMM", { locale: ptBR })
}

/** 'YYYY-MM-DD' -> "quinta, 09 de julho" */
export function formatFullDate(iso: string): string {
  return format(parseISO(iso), "EEEE, dd 'de' MMMM", { locale: ptBR })
}

/** 'YYYY-MM' -> "Julho de 2026" */
export function formatMonthLabel(ym: string): string {
  const [y, m] = ym.split('-').map(Number)
  return format(new Date(y, m - 1, 1), "MMMM 'de' yyyy", { locale: ptBR })
}

/** 'YYYY-MM' -> "jul/26" */
export function formatMonthShort(ym: string): string {
  const [y, m] = ym.split('-').map(Number)
  return format(new Date(y, m - 1, 1), 'MMM/yy', { locale: ptBR })
}

export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/** Data/hora amigável: "09/07/2026 14:32" */
export function formatDateTime(iso: string): string {
  return format(parseISO(iso), 'dd/MM/yyyy HH:mm', { locale: ptBR })
}
