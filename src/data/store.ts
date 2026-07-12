import { useEffect, useRef, useState } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
//  Motor reativo simples. Cada mutação chama bumpData() para as telas
//  recarregarem. Também recarrega quando o app volta ao foco e periodicamente,
//  para que a outra pessoa veja as mudanças em pouco tempo.
// ─────────────────────────────────────────────────────────────────────────────

const listeners = new Set<() => void>()
let version = 0

export function bumpData(): void {
  version += 1
  listeners.forEach((l) => l())
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb)
  return () => {
    listeners.delete(cb)
  }
}

/** Dispara recarga automática ao focar/voltar o app e a cada 30 segundos. */
export function startAutoRefresh(): () => void {
  const onVisible = () => {
    if (document.visibilityState === 'visible') bumpData()
  }
  window.addEventListener('focus', bumpData)
  document.addEventListener('visibilitychange', onVisible)
  const interval = window.setInterval(() => {
    if (document.visibilityState === 'visible') bumpData()
  }, 30_000)
  return () => {
    window.removeEventListener('focus', bumpData)
    document.removeEventListener('visibilitychange', onVisible)
    window.clearInterval(interval)
  }
}

/**
 * Executa uma consulta assíncrona e a re-executa sempre que os dados mudam
 * (via bumpData) ou quando as dependências mudam.
 */
export function useQuery<T>(fn: () => Promise<T>, deps: unknown[], initial: T): T {
  const [data, setData] = useState<T>(initial)
  const [, setTick] = useState(0)
  const fnRef = useRef(fn)
  fnRef.current = fn

  useEffect(() => {
    const unsub = subscribe(() => setTick((t) => t + 1))
    return unsub
  }, [])

  useEffect(() => {
    let active = true
    fnRef
      .current()
      .then((r) => {
        if (active) setData(r)
      })
      .catch((e) => {
        console.error('Erro ao carregar dados:', e)
      })
    return () => {
      active = false
    }
    // Recarrega quando deps mudam ou quando a versão global muda (via setTick).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, version])

  return data
}
