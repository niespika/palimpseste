import { createClient } from '@/utils/supabase/server'
import { inscriptionsClasse } from '@/utils/acces'
import { classeFragmentsActive } from '../contexte-classe'
import LigneTheme from './LigneTheme'
import BoutonActiverClasse from './BoutonActiverClasse'
import type { Profile } from '@/types'
import type { FragmentTheme } from '@/types/fragments'

export default async function PageThemes() {
  const supabase = await createClient()
  const { classe } = await classeFragmentsActive(supabase)

  if (!classe) {
    return (
      <div className="bg-white border border-stone-200 rounded-xl p-8 text-center text-stone-500 text-sm">
        Aucune classe n'a accès à ce module.<br />
        Crée une classe et donne-lui le module depuis <strong>Classes</strong> / <strong>Modules</strong>.
      </div>
    )
  }

  // Inscriptions de la classe active (1 inscription par élève dans cette classe)
  const inscrits = await inscriptionsClasse(supabase, classe.id)
  const eleveIds = inscrits.map((i) => i.eleve_id)
  const inscriptionParEleve = Object.fromEntries(inscrits.map((i) => [i.eleve_id, i.id]))
  const inscriptionIds = inscrits.map((i) => i.id)

  const { data: eleves } = eleveIds.length > 0
    ? await supabase
        .from('profiles')
        .select('id, role, display_name, classe, created_at')
        .in('id', eleveIds)
        .eq('role', 'eleve')
        .order('display_name')
    : { data: [] }

  const { data: themes } = inscriptionIds.length > 0
    ? await supabase
        .from('fragments_themes')
        .select('*')
        .in('inscription_id', inscriptionIds)
    : { data: [] }

  const themeParInscription = Object.fromEntries(
    (themes ?? []).map((t) => [t.inscription_id, t])
  )

  return (
    <div className="space-y-4">
      <div className="bg-white border border-stone-200 rounded-xl px-4 py-3 flex flex-wrap items-center gap-3">
        <span className="text-xs font-medium text-stone-500 uppercase tracking-wide">
          Essai final — {classe.nom}
        </span>
        <BoutonActiverClasse classeId={classe.id} classeNom={classe.nom} />
      </div>

      {!eleves || eleves.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-xl p-8 text-center text-stone-500 text-sm">
          Aucun élève inscrit dans cette classe.<br />
          Inscris des élèves depuis <strong>Classes</strong>.
        </div>
      ) : (
        <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-stone-50 border-b border-stone-200">
              <tr>
                <th className="px-4 py-3 text-xs font-medium text-stone-500 uppercase tracking-wide w-1/4">Élève</th>
                <th className="px-4 py-3 text-xs font-medium text-stone-500 uppercase tracking-wide">Thème</th>
                <th className="px-4 py-3 text-xs font-medium text-stone-500 uppercase tracking-wide text-center w-24">Essai actif</th>
                <th className="px-4 py-3 text-xs font-medium text-stone-500 uppercase tracking-wide">Question d'essai</th>
              </tr>
            </thead>
            <tbody>
              {(eleves as Profile[]).map((eleve) => (
                <LigneTheme
                  key={eleve.id}
                  eleve={eleve}
                  inscriptionId={inscriptionParEleve[eleve.id]}
                  theme={(themeParInscription[inscriptionParEleve[eleve.id]] as FragmentTheme) ?? null}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
