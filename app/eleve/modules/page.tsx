import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { moduleIdsAccessibles } from '@/utils/acces'
import Tuile from '@/components/Tuile'
import type { ModuleSceau } from '@/components/Pastille'

// Index des « mondes » — destination de l'onglet « Modules » de la barre tactile
// (et page d'atterrissage directe). Réutilise la primitive Tuile (sceau + bord
// gauche au pigment du module).

type ModuleInfo = { id: string; slug: string; nom: string; description: string | null; actif: boolean }

// slug en base → clé de sceau/monde (les vars charte utilisent « fragments »).
const SCEAU: Record<string, ModuleSceau> = {
  'fragments-erudition': 'fragments',
  quazian: 'quazian',
  codex: 'codex',
  aletheia: 'aletheia',
}
// Ordre d'affichage (les autres suivent par nom).
const ORDRE = ['fragments-erudition', 'aletheia', 'codex', 'quazian']
const MASQUES = ['scriptorium']

export default async function IndexModulesEleve() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const idsAccessibles = await moduleIdsAccessibles(supabase, user.id)
  const { data: mods } = idsAccessibles.size > 0
    ? await supabase.from('modules').select('id, slug, nom, description, actif').in('id', [...idsAccessibles])
    : { data: [] as ModuleInfo[] }

  const modules = (mods ?? [])
    .filter((m): m is ModuleInfo => !!m && m.actif === true && !MASQUES.includes(m.slug))
    .sort((a, b) => {
      const ia = ORDRE.indexOf(a.slug), ib = ORDRE.indexOf(b.slug)
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib) || a.nom.localeCompare(b.nom)
    })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-titre text-2xl text-encre">Tes mondes</h2>
        <p className="text-sm text-muet mt-1">Choisis un module pour entrer dans son univers.</p>
      </div>

      {modules.length === 0 ? (
        <div className="bg-surface border border-bordure rounded-xl p-8 text-center text-encre-douce text-sm">
          Aucun module ne t&apos;est accessible pour l&apos;instant.<br />Ton professeur t&apos;en donnera l&apos;accès bientôt.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {modules.map((m) => (
            <Tuile
              key={m.id}
              nom={m.nom}
              module={SCEAU[m.slug]}
              avecSceau={!!SCEAU[m.slug]}
              sousTitre={m.description ?? undefined}
              href={`/eleve/modules/${m.slug}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
