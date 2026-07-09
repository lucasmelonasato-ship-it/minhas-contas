import { createContext, useContext } from 'react'

export type Tab = 'inicio' | 'mes' | 'contas' | 'relatorios' | 'ajustes' | 'comprovantes'

export interface AppState {
  ym: string
  setYm: (ym: string) => void
  tab: Tab
  setTab: (t: Tab) => void
}

export const AppContext = createContext<AppState | null>(null)

export function useApp(): AppState {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp deve ser usado dentro de AppContext')
  return ctx
}
