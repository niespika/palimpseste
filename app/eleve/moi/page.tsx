import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { deconnexion } from '../actions'
import { contexteClasseEleve } from '../contexte-classe'
import SelecteurClasseEleve from '../SelecteurClasseEleve'

// Onglet « Moi » (barre tactile). Profil minimal : nom, classe(s), bascule de
// classe (élève multi-classes) et déconnexion. Sur desktop, ces commandes
// restent dans l'en-tête ; cette page sert surtout la navigation mobile.

export default async function MoiEleve() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('display_name').eq('id', user.id).single()
  const { inscriptions, active } = await contexteClasseEleve(supabase, user.id)

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h2 className="font-titre text-2xl text-encre">Moi</h2>
        {profile?.display_name && <p className="text-sm text-muet mt-1">{profile.display_name}</p>}
      </div>

      {/* Classe(s) */}
      <section className="bg-surface border border-bordure rounded-xl p-5 space-y-3">
        <h3 className="font-ui text-xs tracking-[0.1em] text-muet uppercase">Ma classe</h3>
        {active ? (
          <>
            <p className="text-sm text-encre">{active.classe_nom}</p>
            {inscriptions.length > 1 && (
              <div>
                <p className="text-xs text-muet mb-1.5">Changer de classe</p>
                <SelecteurClasseEleve inscriptions={inscriptions} activeId={active.id} />
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-muet">Tu n&apos;es inscrit dans aucune classe pour l&apos;instant.</p>
        )}
      </section>

      {/* Déconnexion */}
      <form action={deconnexion}>
        <button
          type="submit"
          className="w-full font-ui text-sm text-encre-douce border border-bordure rounded-xl py-3 hover:bg-parchemin-fonce transition-colors"
        >
          Se déconnecter
        </button>
      </form>
    </div>
  )
}
