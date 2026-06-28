import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import Pastille from '@/components/Pastille'
import FormulaireMotDePasse from './FormulaireMotDePasse'

// Page atteinte après le lien d'invitation (via /auth/confirm qui a posé la
// session). À la racine de app/ : aucun layout prof/élève ne la garde.
export default async function FinaliserInscription() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?erreur=lien')

  return (
    <div data-module="palimpseste" className="min-h-screen flex items-center justify-center bg-parchemin px-4">
      <div className="bg-surface p-8 rounded-xl shadow-sm border border-bordure w-full max-w-md">
        <div className="mb-8 text-center flex flex-col items-center">
          <Pastille module="palimpseste" size={84} className="mb-4" />
          <h1 className="font-marque text-2xl font-semibold tracking-[0.12em] text-encre">PALIMPSESTE</h1>
          <p className="font-corps text-muet text-sm mt-1">Choisis ton mot de passe</p>
        </div>
        <FormulaireMotDePasse email={user.email ?? ''} />
      </div>
    </div>
  )
}
