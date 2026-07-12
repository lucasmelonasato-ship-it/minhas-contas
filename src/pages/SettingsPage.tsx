import { useRef, useState } from 'react'
import {
  Settings as SettingsIcon,
  Users,
  Download,
  Upload,
  Image as ImageIcon,
  ChevronRight,
  Bell,
  Share,
  ShieldCheck,
  Trash2,
  Plus,
  CalendarPlus,
  LogOut,
} from 'lucide-react'
import { useApp } from '../AppContext'
import { usePeople } from '../hooks'
import { supabase } from '../lib/supabase'
import {
  addPerson,
  updatePerson,
  deletePerson,
  getAllPayments,
  wipeAllData,
} from '../data/repo'
import { exportBackup, importBackup } from '../lib/backup'
import { downloadICS } from '../lib/ics'

const PALETTE = ['#2563eb', '#db2777', '#16a34a', '#ea580c', '#7c3aed', '#0891b2', '#f59e0b', '#dc2626']

export default function SettingsPage() {
  const { setTab } = useApp()
  const people = usePeople()
  const fileRef = useRef<HTMLInputElement>(null)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(PALETTE[2])
  const [msg, setMsg] = useState<string | null>(null)
  const [confirmWipe, setConfirmWipe] = useState(false)

  function flash(text: string) {
    setMsg(text)
    setTimeout(() => setMsg(null), 3000)
  }

  async function handleAddPerson() {
    if (!newName.trim()) return
    await addPerson(newName.trim(), newColor)
    setNewName('')
  }

  async function handleImport(file: File) {
    try {
      await importBackup(file)
      flash('Backup restaurado com sucesso! ✅')
    } catch (e) {
      flash('Não foi possível ler o arquivo de backup.')
      console.error(e)
    }
  }

  async function exportAllUpcoming() {
    const payments = await getAllPayments()
    const future = payments.filter((p) => !p.paid && !p.skipped)
    if (future.length === 0) {
      flash('Não há vencimentos pendentes para exportar.')
      return
    }
    await downloadICS(future, 'minhas-contas-vencimentos.ics')
  }

  async function requestNotifications() {
    if (!('Notification' in window)) {
      flash('Este dispositivo não suporta notificações.')
      return
    }
    const perm = await Notification.requestPermission()
    if (perm === 'granted') {
      new Notification('Minhas Contas', {
        body: 'Notificações ativadas! Vamos te lembrar dos vencimentos.',
      })
      flash('Notificações ativadas ✅')
    } else {
      flash('Notificações não foram permitidas.')
    }
  }

  async function handleWipe() {
    await wipeAllData()
    setConfirmWipe(false)
    flash('Todos os dados de contas foram apagados.')
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-ink-900">
          <SettingsIcon size={24} className="text-brand-600" /> Ajustes
        </h1>
      </header>

      {msg && (
        <div className="rounded-xl bg-brand-50 px-4 py-3 text-sm font-medium text-brand-700 ring-1 ring-brand-200">
          {msg}
        </div>
      )}

      {/* Pessoas */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 font-bold text-ink-800">
          <Users size={18} className="text-brand-600" /> Pessoas
        </h2>
        <div className="card divide-y divide-ink-100">
          {people.map((p) => (
            <div key={p.id} className="flex items-center gap-3 px-4 py-3">
              <span className="h-8 w-8 rounded-full" style={{ background: p.color }} />
              <input
                className="flex-1 bg-transparent font-medium text-ink-800 outline-none"
                defaultValue={p.name}
                onBlur={(e) => {
                  const v = e.target.value.trim()
                  if (v && v !== p.name) updatePerson(p.id, { name: v })
                }}
              />
              {people.length > 1 && (
                <button
                  onClick={() => deletePerson(p.id)}
                  className="rounded-lg p-1.5 text-ink-300 hover:bg-ink-100 hover:text-rose-600"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
          <div className="flex items-center gap-2 px-4 py-3">
            <div className="flex gap-1">
              {PALETTE.slice(0, 4).map((c) => (
                <button
                  key={c}
                  onClick={() => setNewColor(c)}
                  className={`h-6 w-6 rounded-full ${newColor === c ? 'ring-2 ring-offset-1' : ''}`}
                  style={{ background: c, boxShadow: newColor === c ? `0 0 0 2px ${c}` : undefined }}
                />
              ))}
            </div>
            <input
              className="flex-1 bg-transparent text-ink-800 outline-none placeholder:text-ink-400"
              placeholder="Adicionar pessoa…"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddPerson()}
            />
            <button onClick={handleAddPerson} className="rounded-lg p-1.5 text-brand-600 hover:bg-brand-50">
              <Plus size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* Atalhos */}
      <section className="space-y-3">
        <h2 className="font-bold text-ink-800">Geral</h2>
        <div className="card divide-y divide-ink-100">
          <Row
            icon={<ImageIcon size={18} />}
            title="Comprovantes"
            subtitle="Ver todos os comprovantes enviados"
            onClick={() => setTab('comprovantes')}
            chevron
          />
          <Row
            icon={<CalendarPlus size={18} />}
            title="Exportar vencimentos (.ics)"
            subtitle="Adicione todos os vencimentos ao Calendário do iPhone"
            onClick={exportAllUpcoming}
          />
          <Row
            icon={<Bell size={18} />}
            title="Ativar notificações"
            subtitle="Permitir alertas neste aparelho"
            onClick={requestNotifications}
          />
        </div>
      </section>

      {/* Backup */}
      <section className="space-y-3">
        <h2 className="font-bold text-ink-800">Backup e dados</h2>
        <div className="card divide-y divide-ink-100">
          <Row
            icon={<Download size={18} />}
            title="Exportar backup"
            subtitle="Baixe um arquivo com contas e pagamentos"
            onClick={() => {
              exportBackup()
              flash('Backup gerado. Guarde o arquivo em local seguro.')
            }}
          />
          <Row
            icon={<Upload size={18} />}
            title="Restaurar backup"
            subtitle="Envia os dados do arquivo para a nuvem"
            onClick={() => fileRef.current?.click()}
          />
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) handleImport(f)
            e.target.value = ''
          }}
        />
      </section>

      {/* Instalar no iPhone */}
      <section className="space-y-3">
        <h2 className="font-bold text-ink-800">Instalar no celular</h2>
        <div className="card space-y-2.5 px-4 py-4 text-sm text-ink-600">
          <p className="flex items-center gap-2 font-semibold text-ink-800">
            <Share size={18} className="text-brand-600" /> No iPhone (Safari):
          </p>
          <ol className="ml-1 list-inside list-decimal space-y-1 text-ink-500">
            <li>Toque no botão Compartilhar (quadrado com seta pra cima)</li>
            <li>Escolha "Adicionar à Tela de Início"</li>
            <li>Pronto! O app abre em tela cheia, como um aplicativo</li>
          </ol>
        </div>
      </section>

      {/* Privacidade */}
      <div className="flex items-start gap-3 rounded-2xl bg-emerald-50 px-4 py-3.5 ring-1 ring-emerald-200">
        <ShieldCheck size={22} className="mt-0.5 shrink-0 text-emerald-600" />
        <p className="text-sm text-emerald-700">
          <strong>Sincronizado e protegido.</strong> Seus dados ficam na sua conta na nuvem, com
          acesso só para quem tem o login. Lucas e Gabi veem a mesma lista, atualizada
          automaticamente.
        </p>
      </div>

      {/* Conta */}
      <section className="space-y-3">
        <h2 className="font-bold text-ink-800">Conta</h2>
        <button
          onClick={() => supabase.auth.signOut()}
          className="btn w-full justify-start gap-3 rounded-2xl bg-white px-4 py-3.5 text-ink-700 shadow-card hover:bg-ink-50"
        >
          <LogOut size={18} /> Sair desta conta
        </button>
      </section>

      {/* Zona de perigo */}
      <section className="space-y-3">
        <h2 className="font-bold text-rose-600">Zona de perigo</h2>
        <button
          onClick={() => setConfirmWipe(true)}
          className="btn w-full justify-start gap-3 rounded-2xl bg-white px-4 py-3.5 text-rose-600 shadow-card hover:bg-rose-50"
        >
          <Trash2 size={18} /> Apagar todas as contas e comprovantes
        </button>
      </section>

      <p className="pb-2 text-center text-xs text-ink-300">Minhas Contas · v2.0</p>

      {confirmWipe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-ink-900/40" onClick={() => setConfirmWipe(false)} />
          <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white p-5 shadow-soft">
            <h3 className="text-lg font-bold text-ink-900">Apagar tudo?</h3>
            <p className="mt-1 text-sm text-ink-500">
              Todas as contas, pagamentos e comprovantes serão apagados da nuvem (para os dois).
              As pessoas serão mantidas. Isso não dá para desfazer.
            </p>
            <div className="mt-4 flex gap-2">
              <button onClick={() => setConfirmWipe(false)} className="btn-ghost flex-1 py-2.5">
                Cancelar
              </button>
              <button onClick={handleWipe} className="btn-danger flex-1 py-2.5">
                Apagar tudo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Row({
  icon,
  title,
  subtitle,
  onClick,
  chevron,
}: {
  icon: React.ReactNode
  title: string
  subtitle?: string
  onClick?: () => void
  chevron?: boolean
}) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-ink-50">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold text-ink-800">{title}</span>
        {subtitle && <span className="block truncate text-xs text-ink-400">{subtitle}</span>}
      </span>
      {chevron && <ChevronRight size={18} className="shrink-0 text-ink-300" />}
    </button>
  )
}
