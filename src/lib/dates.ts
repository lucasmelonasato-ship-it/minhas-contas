/** Utilidades de mês/competência independentes de fuso horário. */

/** Retorna a competência do mês atual: 'YYYY-MM' */
export function currentYM(): string {
  const now = new Date()
  return toYM(now.getFullYear(), now.getMonth() + 1)
}

export function toYM(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`
}

export function parseYM(ym: string): { year: number; month: number } {
  const [year, month] = ym.split('-').map(Number)
  return { year, month }
}

/** Avança/retrocede N meses a partir de uma competência. */
export function addMonthsYM(ym: string, delta: number): string {
  const { year, month } = parseYM(ym)
  const total = year * 12 + (month - 1) + delta
  const y = Math.floor(total / 12)
  const m = (total % 12) + 1
  return toYM(y, m)
}

/** Diferença em meses entre duas competências (b - a). */
export function monthsBetween(
  aYear: number,
  aMonth: number,
  bYear: number,
  bMonth: number,
): number {
  return (bYear - aYear) * 12 + (bMonth - aMonth)
}

/** Último dia do mês (28–31). */
export function lastDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

/** Constrói a data de vencimento 'YYYY-MM-DD' ajustando o dia ao mês. */
export function buildDueDate(year: number, month: number, day: number): string {
  const d = Math.min(day, lastDayOfMonth(year, month))
  return `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

/** Data de hoje como 'YYYY-MM-DD' (fuso local). */
export function todayISO(): string {
  const n = new Date()
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(
    n.getDate(),
  ).padStart(2, '0')}`
}

/** Quantos dias faltam (negativo = atrasado) entre hoje e uma data 'YYYY-MM-DD'. */
export function daysUntil(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number)
  const target = new Date(y, m - 1, d)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((target.getTime() - today.getTime()) / 86_400_000)
}
