// ============================================================================
// C4 · L4 — LA PASSATION EN CLASSE, côté professeur, DANS CODEX.
// ----------------------------------------------------------------------------
// « Ses écrans vivent dans Codex (l'écriture diagnostique) et Aletheia (la
//   lecture diagnostique) — c'est le MÊME FLUX dans deux modules. »
//
// ⚠️ CETTE PAGE NE RÉORGANISE PAS LA NAVIGATION (piège 55) : elle ne s'ajoute
//    pas aux sous-onglets de `components/nav/configModules.ts` — Codex en porte
//    déjà trois, et « un module = 2-3 onglets » (`AGENTS.md`). Les onglets sont
//    C4-L6 et C5-L4 ; on s'y pose tel quel.
// ============================================================================

import { notFound } from 'next/navigation'
import { garderProf } from '@/utils/passation/garde'
import { chargerVueProf } from '@/utils/passation/vues'
import { EcranProf } from '@/components/passation/EcranProf'
import { CHAMPS_IDENTITE, memeIdentiteDeMesure } from '@/utils/examens/deplacement'
import ReunirCopies from './ReunirCopies'
import SupprimerConception from './SupprimerConception'

/**
 * L'autre conception du MÊME examen pour la même classe, s'il y en a une.
 *
 * Un examen conçu deux fois éparpille les copies entre les deux instances. On
 * ne propose de les réunir que si les deux exercices sont identiques POUR LA
 * MESURE — la comparaison porte sur tous les champs qui entrent dans le
 * jugement (`utils/examens/deplacement.ts`), jamais sur le seul titre affiché.
 *
 * ⚠️ La proposition est un CONFORT D'ÉCRAN : c'est l'action serveur qui refuse
 *    ou non, et elle recompare. Un bandeau affiché à tort ne peut donc rien
 *    déplacer d'illicite.
 */
async function jumelleIdentique(
  admin: Awaited<ReturnType<typeof garderProf>>['admin'],
  exerciceId: string,
): Promise<string | null> {
  const champs = ['id', ...CHAMPS_IDENTITE].join(', ')
  const { data: moi } = await admin.from('exercices').select(champs).eq('id', exerciceId).maybeSingle()
  if (!moi) return null
  const source = moi as unknown as Record<string, unknown>
  const classeId = source.classe_id as string | null
  if (!classeId) return null

  const { data: voisines } = await admin
    .from('exercices').select(champs).eq('classe_id', classeId).neq('id', exerciceId)
  const jumelle = ((voisines ?? []) as unknown as Array<Record<string, unknown>>)
    .find((e) => memeIdentiteDeMesure(source, e))
  return jumelle ? (jumelle.id as string) : null
}

export default async function PassationCodexProf(
  { params }: { params: Promise<{ exerciceId: string }> },
) {
  const { exerciceId } = await params
  const { admin, actif } = await garderProf()
  const vue = await chargerVueProf(admin, exerciceId, actif)
  if (!vue) notFound()
  const cibleId = await jumelleIdentique(admin, exerciceId)
  // Une conception HORS PLAN et sans copie écrite est un résidu : elle n'a
  // aucune sortie par « Retirer du plan », qui suppose une ligne de plan.
  const { data: rattachement } = await admin
    .from('exercices').select('exercice_planifie_id').eq('id', exerciceId).maybeSingle()
  const horsPlan = !(rattachement as { exercice_planifie_id: string | null } | null)?.exercice_planifie_id
  const aucuneCopie = vue.copies.every((c) => !c.copie && !c.aDeposé)
  return (
    <main className="mx-auto max-w-4xl p-4">
      <h1 className="font-cinzel text-xl text-encre">Passation en classe</h1>
      <p className="mt-1 text-sm text-muet">Codex — l’écriture diagnostique</p>
      <div className="mt-6">
        {cibleId && (
          <ReunirCopies
            cibleId={cibleId}
            copies={vue.copies.map((c) => ({ depotId: c.depotId, nom: c.eleve, remise: !!c.copie || c.aDeposé }))}
          />
        )}
        {aucuneCopie && <SupprimerConception exerciceId={exerciceId} horsPlan={horsPlan} />}
        <EcranProf vue={vue} />
      </div>
    </main>
  )
}
