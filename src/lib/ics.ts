import { db, type Payment } from '../db/db'
import { formatBRL } from './format'

// Gera um arquivo .ics (padrão iCalendar) com os vencimentos como eventos de
// dia inteiro e um alarme no dia anterior. Ao abrir no iPhone, o usuário pode
// adicionar tudo ao Calendário nativo — que dispara lembretes de forma confiável.

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function icsDate(iso: string): string {
  return iso.replace(/-/g, '') // 'YYYYMMDD'
}

function nextDay(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(y, m - 1, d + 1)
  return `${dt.getFullYear()}${pad(dt.getMonth() + 1)}${pad(dt.getDate())}`
}

function escapeText(s: string): string {
  return s.replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n')
}

export async function buildICS(payments: Payment[]): Promise<string> {
  const bills = await db.bills.toArray()
  const billName = new Map(bills.map((b) => [b.id, b.name]))
  const stamp =
    new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Minhas Contas//PT-BR//',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Minhas Contas — Vencimentos',
  ]

  for (const p of payments) {
    if (p.paid || p.skipped) continue
    const name = billName.get(p.billId) ?? 'Conta'
    const title = `💸 ${name} — ${formatBRL(p.amount)}`
    lines.push(
      'BEGIN:VEVENT',
      `UID:minhas-contas-${p.id}-${p.competencia}@local`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${icsDate(p.dueDate)}`,
      `DTEND;VALUE=DATE:${nextDay(p.dueDate)}`,
      `SUMMARY:${escapeText(title)}`,
      `DESCRIPTION:${escapeText(`Vencimento de "${name}". Valor: ${formatBRL(p.amount)}.`)}`,
      'BEGIN:VALARM',
      'TRIGGER:-P1D',
      'ACTION:DISPLAY',
      `DESCRIPTION:${escapeText(`Amanhã vence: ${name}`)}`,
      'END:VALARM',
      'BEGIN:VALARM',
      'TRIGGER:PT9H',
      'ACTION:DISPLAY',
      `DESCRIPTION:${escapeText(`Vence hoje: ${name}`)}`,
      'END:VALARM',
      'END:VEVENT',
    )
  }

  lines.push('END:VCALENDAR')
  return lines.join('\r\n')
}

export async function downloadICS(payments: Payment[], filename: string): Promise<void> {
  const ics = await buildICS(payments)
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
  triggerDownload(blob, filename)
}

export function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}
