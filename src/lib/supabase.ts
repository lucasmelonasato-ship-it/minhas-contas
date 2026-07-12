import { createClient } from '@supabase/supabase-js'

// Credenciais do projeto Supabase (banco de dados na nuvem).
// A chave "publishable" é feita para ficar no app — quem protege os dados são
// as regras de segurança (RLS) configuradas no banco.
const SUPABASE_URL = 'https://wemhlqtuqelisakssbbj.supabase.co'
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_aG_6O4ypo5PNyB6O44dfVg_VHBu4Ifj'

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
})

export const RECEIPTS_BUCKET = 'comprovantes'
