import { useState } from 'react'
import { Wallet, Mail, Lock, Users } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [mode, setMode] = useState<'entrar' | 'criar'>('entrar')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!email.trim() || password.length < 6) {
      setError('Informe um e-mail válido e uma senha de pelo menos 6 caracteres.')
      return
    }
    setLoading(true)
    try {
      if (mode === 'criar') {
        const { error } = await supabase.auth.signUp({ email: email.trim(), password })
        if (error) throw error
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })
        if (error) throw error
      }
      // O App detecta a sessão via onAuthStateChange.
    } catch (err) {
      const msg = (err as { message?: string })?.message ?? ''
      if (/invalid login credentials/i.test(msg)) {
        setError('E-mail ou senha incorretos.')
      } else if (/already registered|already exists/i.test(msg)) {
        setError('Esse e-mail já tem conta. Toque em "Entrar".')
      } else {
        setError(msg || 'Não foi possível entrar. Tente de novo.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-brand-600 to-brand-800 px-6 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center text-white">
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-white/15 backdrop-blur">
            <Wallet size={34} />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">Minhas Contas</h1>
          <p className="mt-1 text-sm text-brand-100">
            Controle tudo que você tem a pagar
          </p>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-soft">
          {/* Abas */}
          <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-ink-100 p-1">
            {(['entrar', 'criar'] as const).map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m)
                  setError(null)
                }}
                className={`rounded-lg py-2 text-sm font-semibold transition ${
                  mode === m ? 'bg-white text-brand-700 shadow-card' : 'text-ink-500'
                }`}
              >
                {m === 'entrar' ? 'Entrar' : 'Criar conta'}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-3">
            <div>
              <label className="label">E-mail</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
                <input
                  type="email"
                  autoComplete="email"
                  className="input pl-11"
                  placeholder="voce@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="label">Senha</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
                <input
                  type="password"
                  autoComplete={mode === 'criar' ? 'new-password' : 'current-password'}
                  className="input pl-11"
                  placeholder="mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3.5 text-base disabled:opacity-60"
            >
              {loading ? 'Aguarde…' : mode === 'entrar' ? 'Entrar' : 'Criar conta'}
            </button>
          </form>

          <div className="mt-5 flex items-start gap-2.5 rounded-xl bg-brand-50 px-3.5 py-3 text-xs text-brand-700">
            <Users size={26} className="shrink-0" />
            <p>
              <strong>Para compartilhar:</strong> Lucas e Gabi devem entrar com o{' '}
              <strong>mesmo e-mail e senha</strong>. Assim os dois veem e editam a mesma lista de
              contas, nos dois celulares e no PC.
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-brand-100">
          Seus dados ficam protegidos na sua conta. 🔒
        </p>
      </div>
    </div>
  )
}
