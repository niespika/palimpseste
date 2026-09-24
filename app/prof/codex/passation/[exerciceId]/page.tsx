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
import { lancer } from '@/utils/lancer'
import { EcranProf } from '@/components/passation/EcranProf'
import { lireLaPorteCopieAnnotee } from '@/utils/copie/porte'
import { chargerEntretienDeConception } from '@/utils/examens/entretien-serveur'
import EntretienConception from '@/components/passation/EntretienConception'
import Link from 'next/link'
import { lireEtOuvrirSiVenue, estPreparee, friseDe, compterLesCopies } from '@/utils/examens/epreuve-serveur'
import { heureMurale, libelleDuree } from '@/utils/examens/epreuve'
import { lireFuseau } from '@/utils/fuseau-serveur'

export default async function PassationCodexProf(
  { params }: { params: Promise<{ exerciceId: string }> },
) {
  const { exerciceId } = await params
  const { admin, actif } = await garderProf()
  // ⭐ 18/09 — la porte de la copie annotée part avec la vue (deux lectures
  //    indépendantes, patron `utils/lancer.ts`) ; attendue à sa place d'avant.
  const copieAnnoteeQ = lancer(lireLaPorteCopieAnnotee(admin))
  // ⭐ 24/09 — L'ÉPREUVE MINUTÉE : lue AVANT la vue, parce que la lecture ouvre le
  //    dépôt si la moitié du temps est passée — la vue montre alors l'état vrai.
  //    Porte fermée : `epreuve` vaut null et la page est celle d'hier.
  const [{ epreuve }, fuseau] = await Promise.all([lireEtOuvrirSiVenue(admin, exerciceId), lireFuseau()])
  const vue = await chargerVueProf(admin, exerciceId, actif)
  // La copie annotée (03/09) : à ON, la liste devient une liste de noms.
  const copieAnnotee = await copieAnnoteeQ
  if (!vue) notFound()
  const entretien = await chargerEntretienDeConception(admin, exerciceId, vue.copies)
  return (
    <main className="mx-auto max-w-4xl p-4">
      <h1 className="font-cinzel text-xl text-encre">Passation en classe</h1>
      <p className="mt-1 text-sm text-muet">Codex — l’écriture diagnostique</p>
      {epreuve && epreuve.estUnEssaiCodex && epreuve.lieu === 'classe' && (
        <BandeauEpreuve exerciceId={exerciceId} epreuve={epreuve} fuseau={fuseau}
          ouvertLe={(await compterLesCopies(admin, exerciceId)).ouvertLe} />
      )}
      <div className="mt-6">
        <EntretienConception exerciceId={exerciceId} entretien={entretien} />
        <EcranProf vue={vue} baseCopie={copieAnnotee ? '/prof/codex/copie' : undefined} />
      </div>
    </main>
  )
}

/**
 * ⭐ 24/09 — la porte de la page projetée, et l'état de l'épreuve en une ligne.
 *    Posée ICI, dans la route de Codex, et pas dans `EcranProf` : ce composant
 *    sert aussi Aletheia et l'essai de Fragments, qui ne se minutent pas.
 */
function BandeauEpreuve({ exerciceId, epreuve, fuseau, ouvertLe }: {
  exerciceId: string
  epreuve: NonNullable<Awaited<ReturnType<typeof lireEtOuvrirSiVenue>>['epreuve']>
  fuseau: string
  /** Le FAIT : le premier dépôt ouvert (automatiquement ou à la main), ou null. */
  ouvertLe: string | null
}) {
  // eslint-disable-next-line react-hooks/purity -- Server Component : l'heure du serveur fait foi.
  const maintenant = Date.now()
  const frise = estPreparee(epreuve) ? friseDe(epreuve, maintenant) : null
  return (
    <section className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-bordure bg-surface p-3">
      <p className="min-w-0 flex-1 font-ui text-sm text-encre-douce">
        <strong className="text-encre">L’épreuve minutée.</strong>{' '}
        {!frise
          ? 'Aucune durée n’est fixée : réglez-la sur la page projetée.'
          : frise.phase === 'avant'
          ? `Rédaction ${libelleDuree(epreuve.redactionMin ?? 0)}, relecture ${libelleDuree(epreuve.relectureMin ?? 0)} — pas encore lancée.`
          : `Lancée à ${heureMurale(frise.debutMs!, fuseau)} ; `
            + (ouvertLe
              ? `dépôt ouvert à ${heureMurale(Date.parse(ouvertLe), fuseau)} ; `
              : `le dépôt s’ouvrira tout seul à ${heureMurale(frise.ouvertureMs!, fuseau)} ; `)
            + `fin de la rédaction à ${heureMurale(frise.finRedactionMs!, fuseau)}.`}
      </p>
      <Link href={`/prof/codex/passation/${exerciceId}/projection`} target="_blank"
        className="min-h-11 shrink-0 rounded-lg bg-bouton-plan px-4 py-2 font-ui text-sm text-bouton-plan-texte hover:opacity-90">
        Ouvrir la page projetée ↗
      </Link>
    </section>
  )
}
