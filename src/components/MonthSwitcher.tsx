import { ChevronLeft, ChevronRight } from 'lucide-react'
import { addMonthsYM, currentYM } from '../lib/dates'
import { capitalize, formatMonthLabel } from '../lib/format'
import { useApp } from '../AppContext'

export function MonthSwitcher() {
  const { ym, setYm } = useApp()
  const isCurrent = ym === currentYM()
  return (
    <div className="flex items-center justify-between gap-2">
      <button
        onClick={() => setYm(addMonthsYM(ym, -1))}
        className="grid h-10 w-10 place-items-center rounded-xl bg-white text-ink-600 shadow-card hover:bg-ink-50"
        aria-label="Mês anterior"
      >
        <ChevronLeft size={20} />
      </button>
      <button
        onClick={() => setYm(currentYM())}
        className="flex flex-col items-center"
        title="Voltar ao mês atual"
      >
        <span className="text-base font-bold text-ink-900">
          {capitalize(formatMonthLabel(ym))}
        </span>
        {!isCurrent && <span className="text-xs font-medium text-brand-600">voltar ao mês atual</span>}
      </button>
      <button
        onClick={() => setYm(addMonthsYM(ym, 1))}
        className="grid h-10 w-10 place-items-center rounded-xl bg-white text-ink-600 shadow-card hover:bg-ink-50"
        aria-label="Próximo mês"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  )
}
