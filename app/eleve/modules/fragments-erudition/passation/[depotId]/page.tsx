// ============================================================================
// C6 · L4 — LA PASSATION EN CLASSE, côté élève, DANS FRAGMENTS.
// ----------------------------------------------------------------------------
// « L'élève lit PAR SON MODULE, et son module est Fragments. » La troisième
// porte du MÊME écran (`EcranEleve`, `chargerVueEleve`), sous l'onglet Essai
// (`?vue=essai` — la face élève de Fragments pilote ses onglets par la vue).
//
// ⚠️ L'ÉLÈVE NE DÉPOSE PAS ICI. Ses photos entrent par l'onglet Essai de
//    Fragments, et la transcription se fait SANS contrôle de sa part (`06-` §1 :
//    « manuscrit → photos → transcription », trois étapes). Tant que la copie
//    n'est pas remise, cet écran le dit et ne montre pas le dépôt de C4-L4 —
//    sinon il y aurait deux chemins de dépôt pour une même copie.
//
// ⚠️⚠️ DEUX RETOURS POUR UNE COPIE, ET L'ÉCRAN LE DIT (piège 44).
// ============================================================================

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { garderEleve } from '@/utils/passation/garde'
import { chargerVueEleve } from '@/utils/passation/vues'
import { EcranEleve } from '@/components/passation/EcranEleve'
import { essaiDuDepot } from '@/utils/essai/branchement-serveur'

const ONGLET_ESSAI = '/eleve/modules/fragments-erudition?vue=essai'

export default async function PassationFragmentsEleve(
  { params }: { params: Promise<{ depotId: string }> },
) {
  const { depotId } = await params
  const { admin, userId, ouvert } = await garderEleve()
  const vue = await chargerVueEleve(admin, depotId, userId)
  if (!vue) notFound()
  const essai = await essaiDuDepot(admin, depotId)
  if (!essai) notFound()

  if (!ouvert) {
    return (
      <main className="mx-auto max-w-2xl p-4">
        <p className="rounded-lg border border-bordure bg-surface p-4 text-encre">
          Cet écran n’est pas encore ouvert. Ton professeur t’indiquera quand.
        </p>
      </main>
    )
  }

  const enTete = (
    <div className="mb-4">
      <Link href={ONGLET_ESSAI} className="text-sm text-muet hover:text-encre-douce">← Essai</Link>
      <h1 className="mt-2 font-cinzel text-xl text-encre">{essai.titre}</h1>
      <p className="mt-1 text-sm text-muet">Ta copie dans la chaîne de mesure · {essai.classeNom}</p>
      <div className="mt-3 rounded-lg border border-bordure bg-parchemin-fonce p-3 text-sm text-encre-douce">
        <strong className="text-encre">Ton essai a deux retours.</strong> Celui de ton professeur
        dans Fragments — ses lettres et sa note — se lit sous{' '}
        <Link href={ONGLET_ESSAI} className="underline">l’onglet Essai</Link>. Celui-ci vient de la
        chaîne de mesure : trois compétences, Expression, Argumentation et Structure. Les deux se
        lisent séparément, et chacun te demande de confirmer que tu l’as lu.
      </div>
    </div>
  )

  if (!vue.valide) {
    const deposee = (vue.photos?.length ?? 0) > 0
    return (
      <main className="mx-auto max-w-2xl p-4">
        {enTete}
        <p className="rounded-lg border border-bordure bg-surface p-4 text-encre">
          {deposee
            ? 'Ta copie est déposée : elle est en cours de transcription. Tu n’as rien à faire ici — ton retour apparaîtra sur cette page quand ton professeur l’aura publié.'
            : 'Tu n’as pas encore déposé ta copie. Dépose tes photos sous l’onglet Essai : elles entreront ici d’elles-mêmes.'}
        </p>
        {vue.attente.some((a) => a.echec_definitif) && (
          <p className="mt-3 rounded-lg border border-retard bg-retard-teinte p-3 text-sm text-retard">
            La transcription de ta copie n’a pas abouti. Préviens ton professeur.
          </p>
        )}
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-2xl p-4">
      {enTete}
      {/* ⭐ Trois étapes, pas quatre : l'essai n'a pas de relecture (`06-` §1). */}
      <EcranEleve vue={{ ...vue, sansRelecture: true }} />
    </main>
  )
}
