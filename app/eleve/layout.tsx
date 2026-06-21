import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { deconnexion } from './actions'

export default async function EleveLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, display_name')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'eleve') redirect('/prof')

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white border-b border-stone-200 print:hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <span className="text-base font-serif text-stone-900 font-medium">Palimpseste</span>
          <form action={deconnexion}>
            <button
              type="submit"
              className="text-sm text-stone-500 hover:text-stone-800 transition-colors"
            >
              Se déconnecter
            </button>
          </form>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {children}
      </main>
    </div>
  )
}
