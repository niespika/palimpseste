import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { deconnexion } from './actions'

export default async function ProfLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, display_name')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'prof') redirect('/eleve')

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white border-b border-stone-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="text-base font-serif text-stone-900 font-medium">Palimpseste</span>
            <nav className="hidden sm:flex items-center gap-1">
              <Link
                href="/prof"
                className="px-3 py-1.5 text-sm text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-md transition-colors"
              >
                Tableau de bord
              </Link>
              <Link
                href="/prof/eleves"
                className="px-3 py-1.5 text-sm text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-md transition-colors"
              >
                Élèves
              </Link>
              <Link
                href="/prof/classes"
                className="px-3 py-1.5 text-sm text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-md transition-colors"
              >
                Classes
              </Link>
              <Link
                href="/prof/modules"
                className="px-3 py-1.5 text-sm text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-md transition-colors"
              >
                Modules
              </Link>
              <Link
                href="/prof/calendrier"
                className="px-3 py-1.5 text-sm text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-md transition-colors"
              >
                Calendrier
              </Link>
              <Link
                href="/prof/fragments-erudition"
                className="px-3 py-1.5 text-sm text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-md transition-colors"
              >
                Fragments
              </Link>
              <Link
                href="/prof/scriptorium"
                className="px-3 py-1.5 text-sm text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-md transition-colors"
              >
                Scriptorium
              </Link>
              <Link
                href="/prof/quazian"
                className="px-3 py-1.5 text-sm text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-md transition-colors"
              >
                Quazian
              </Link>
              <Link
                href="/prof/codex"
                className="px-3 py-1.5 text-sm text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-md transition-colors"
              >
                Codex
              </Link>
              <Link
                href="/prof/aletheia"
                className="px-3 py-1.5 text-sm text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-md transition-colors"
              >
                Aletheia
              </Link>
            </nav>
          </div>
          <form action={deconnexion}>
            <button
              type="submit"
              className="text-sm text-stone-500 hover:text-stone-800 transition-colors"
            >
              Se déconnecter
            </button>
          </form>
        </div>
        {/* Navigation mobile */}
        <div className="sm:hidden border-t border-stone-100 px-4 py-2 flex gap-2">
          <Link href="/prof" className="flex-1 text-center px-2 py-1.5 text-sm text-stone-600 hover:bg-stone-100 rounded-md">
            Accueil
          </Link>
          <Link href="/prof/eleves" className="flex-1 text-center px-2 py-1.5 text-sm text-stone-600 hover:bg-stone-100 rounded-md">
            Élèves
          </Link>
          <Link href="/prof/classes" className="flex-1 text-center px-2 py-1.5 text-sm text-stone-600 hover:bg-stone-100 rounded-md">
            Classes
          </Link>
          <Link href="/prof/modules" className="flex-1 text-center px-2 py-1.5 text-sm text-stone-600 hover:bg-stone-100 rounded-md">
            Modules
          </Link>
          <Link href="/prof/calendrier" className="flex-1 text-center px-2 py-1.5 text-sm text-stone-600 hover:bg-stone-100 rounded-md">
            Calendrier
          </Link>
          <Link href="/prof/fragments-erudition" className="flex-1 text-center px-2 py-1.5 text-sm text-stone-600 hover:bg-stone-100 rounded-md">
            Fragments
          </Link>
          <Link href="/prof/scriptorium" className="flex-1 text-center px-2 py-1.5 text-sm text-stone-600 hover:bg-stone-100 rounded-md">
            Scriptorium
          </Link>
          <Link href="/prof/quazian" className="flex-1 text-center px-2 py-1.5 text-sm text-stone-600 hover:bg-stone-100 rounded-md">
            Quazian
          </Link>
          <Link href="/prof/codex" className="flex-1 text-center px-2 py-1.5 text-sm text-stone-600 hover:bg-stone-100 rounded-md">
            Codex
          </Link>
          <Link href="/prof/aletheia" className="flex-1 text-center px-2 py-1.5 text-sm text-stone-600 hover:bg-stone-100 rounded-md">
            Aletheia
          </Link>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {children}
      </main>
    </div>
  )
}
