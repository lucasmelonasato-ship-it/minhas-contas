import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import {
  Home,
  CalendarDays,
  ListChecks,
  BarChart3,
  Settings as SettingsIcon,
  Wallet,
} from 'lucide-react'
import { AppContext, type Tab } from './AppContext'
import { supabase } from './lib/supabase'
import { seedPeopleIfEmpty, ensureMonthPayments } from './data/repo'
import { startAutoRefresh } from './data/store'
import { addMonthsYM, currentYM } from './lib/dates'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import MonthView from './pages/MonthView'
import BillsPage from './pages/BillsPage'
import SettingsPage from './pages/SettingsPage'

const ReportsPage = lazy(() => import('./pages/ReportsPage'))
const ReceiptsPage = lazy(() => import('./pages/ReceiptsPage'))

const NAV: { tab: Tab; label: string; icon: typeof Home }[] = [
  { tab: 'inicio', label: 'Início', icon: Home },
  { tab: 'mes', label: 'Mês', icon: CalendarDays },
  { tab: 'contas', label: 'Contas', icon: ListChecks },
  { tab: 'relatorios', label: 'Relatórios', icon: BarChart3 },
  { tab: 'ajustes', label: 'Ajustes', icon: SettingsIcon },
]

function Splash({ text }: { text: string }) {
  return (
    <div className="grid min-h-screen place-items-center bg-ink-50">
      <div className="flex flex-col items-center gap-3 text-ink-400">
        <Wallet size={40} className="animate-pulse text-brand-500" />
        <p className="text-sm font-medium">{text}</p>
      </div>
    </div>
  )
}

export default function App() {
  const [tab, setTab] = useState<Tab>('inicio')
  const [ym, setYm] = useState<string>(currentYM())
  const [session, setSession] = useState<Session | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [dataReady, setDataReady] = useState(false)

  // Sessão de login
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setAuthReady(true)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      setAuthReady(true)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  // Ao logar: semear pessoas, materializar meses e ligar a atualização automática
  useEffect(() => {
    if (!session) {
      setDataReady(false)
      return
    }
    let stop: (() => void) | undefined
    ;(async () => {
      try {
        await seedPeopleIfEmpty()
        const cur = currentYM()
        await ensureMonthPayments(addMonthsYM(cur, -1))
        await ensureMonthPayments(cur)
        await ensureMonthPayments(addMonthsYM(cur, 1))
      } catch (e) {
        console.error('Inicialização:', e)
      } finally {
        setDataReady(true)
        stop = startAutoRefresh()
      }
    })()
    return () => stop?.()
  }, [session])

  // Ao trocar o mês visível, garante as ocorrências daquele mês
  useEffect(() => {
    if (session && dataReady) ensureMonthPayments(ym)
  }, [ym, session, dataReady])

  const ctx = useMemo(() => ({ ym, setYm, tab, setTab }), [ym, tab])

  if (!authReady) return <Splash text="Carregando…" />
  if (!session) return <Login />
  if (!dataReady) return <Splash text="Sincronizando suas contas…" />

  return (
    <AppContext.Provider value={ctx}>
      <div className="min-h-screen bg-ink-50 text-ink-900 md:flex">
        {/* Navegação lateral (desktop) */}
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-ink-200 bg-white px-4 py-6 md:flex">
          <div className="mb-8 flex items-center gap-2.5 px-2">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-600 text-white">
              <Wallet size={22} />
            </div>
            <div>
              <p className="text-sm font-bold leading-tight text-ink-900">Minhas Contas</p>
              <p className="text-xs text-ink-400">Gestão financeira</p>
            </div>
          </div>
          <nav className="flex flex-col gap-1">
            {NAV.map((n) => {
              const Icon = n.icon
              const active = tab === n.tab
              return (
                <button
                  key={n.tab}
                  onClick={() => setTab(n.tab)}
                  className={`flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition-colors ${
                    active
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-ink-500 hover:bg-ink-50 hover:text-ink-800'
                  }`}
                >
                  <Icon size={20} />
                  {n.label}
                </button>
              )
            })}
          </nav>
          <div className="mt-auto px-2 text-xs text-ink-300">v2.0 · sincronizado na nuvem</div>
        </aside>

        {/* Conteúdo */}
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-28 pt-5 md:px-8 md:pb-10 md:pt-8">
          <Suspense
            fallback={<div className="py-20 text-center text-sm text-ink-400">Carregando…</div>}
          >
            {tab === 'inicio' && <Dashboard />}
            {tab === 'mes' && <MonthView />}
            {tab === 'contas' && <BillsPage />}
            {tab === 'relatorios' && <ReportsPage />}
            {tab === 'ajustes' && <SettingsPage />}
            {tab === 'comprovantes' && <ReceiptsPage />}
          </Suspense>
        </main>

        {/* Navegação inferior (celular) */}
        <nav
          className="fixed inset-x-0 bottom-0 z-40 flex border-t border-ink-200 bg-white/95 backdrop-blur md:hidden"
          style={{ paddingBottom: 'var(--safe-bottom)' }}
        >
          {NAV.map((n) => {
            const Icon = n.icon
            const active = tab === n.tab
            return (
              <button
                key={n.tab}
                onClick={() => setTab(n.tab)}
                className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors ${
                  active ? 'text-brand-600' : 'text-ink-400'
                }`}
              >
                <Icon size={22} strokeWidth={active ? 2.4 : 1.9} />
                {n.label}
              </button>
            )
          })}
        </nav>
      </div>
    </AppContext.Provider>
  )
}
