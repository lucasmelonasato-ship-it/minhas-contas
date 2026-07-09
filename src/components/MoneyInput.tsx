import { useEffect, useState } from 'react'
import { centsToInput, parseToCents } from '../lib/format'

/** Campo de valor em reais. Emite o valor em centavos. */
export function MoneyInput({
  valueCents,
  onChange,
  placeholder = '0,00',
  autoFocus,
  id,
}: {
  valueCents: number
  onChange: (cents: number) => void
  placeholder?: string
  autoFocus?: boolean
  id?: string
}) {
  const [text, setText] = useState(valueCents ? centsToInput(valueCents) : '')

  // Sincroniza se o valor externo mudar (ex.: abrir modal de edição).
  useEffect(() => {
    setText(valueCents ? centsToInput(valueCents) : '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valueCents])

  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-semibold text-ink-400">
        R$
      </span>
      <input
        id={id}
        inputMode="decimal"
        autoFocus={autoFocus}
        className="input pl-11 text-right text-lg font-semibold tabular-nums"
        placeholder={placeholder}
        value={text}
        onChange={(e) => {
          const raw = e.target.value.replace(/[^\d.,]/g, '')
          setText(raw)
          onChange(parseToCents(raw))
        }}
        onBlur={() => {
          const c = parseToCents(text)
          setText(c ? centsToInput(c) : '')
        }}
      />
    </div>
  )
}
