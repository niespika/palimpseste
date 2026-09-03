// ============================================================================
// C4 · L4 — LA PASSATION EN CLASSE, côté professeur, DANS ALETHEIA.
// ----------------------------------------------------------------------------
// « Ses écrans vivent dans Codex (l'écriture diagnostique) et Aletheia (la
//   lecture diagnostique) — c'est le MÊME FLUX dans deux modules. »
//
// ⭐ C5-L4 — CETTE PAGE A DÉSORMAIS DEUX PORTES, ET ELLE N'EST TOUJOURS PAS UN
//    ONGLET. Elle n'a jamais eu qu'UN SEUL lien dans tout le dépôt
//    (`app/prof/conception/[id]/page.tsx`, « là où le professeur vient déjà
//    d'assigner ») ; CE LIEN RESTE, et l'onglet Exercices d'Aletheia en ajoute
//    un second, depuis sa liste des passations de lecture. *Deux portes vers le
//    même écran ne sont pas un doublon : ce sont deux moments du professeur.*
//    ⚠️ Elle reste hors de la barre — « un module = 2-3 onglets » (`AGENTS.md`),
//       et Aletheia en porte trois. C'est le `prefixes[]` d'Exercices
//       (`components/nav/configModules.ts`) qui garde l'onglet allumé ici.
//
// ⭐ 26/08 — l'entretien des conceptions (réunir les doublons, supprimer les
//    résidus) vit ICI AUSSI, et c'est le sens du « même flux dans deux modules » :
//    le résidu trouvé sur 1HLP était une LECTURE, donc invisible depuis Codex.
//
// ⚠️ `<div>`, PAS `<main>` — C5-L4. La coquille du rôle (`app/eleve/layout.tsx`,
//    `app/prof/layout.tsx`) rend DÉJÀ un `<main>` autour de tout le sous-arbre :
//    un `<main>` imbriqué n'est pas une coquetterie, c'est un défaut
//    d'accessibilité qui S'ENTEND au lecteur d'écran — deux repères « principal »
//    dans une page qui n'en a qu'un, et deux largeurs de colonne concurrentes.
//    Les classes sont INCHANGÉES ; seule la balise l'est.
//    ⚠️ Les trois pages jumelles de CODEX portent le même défaut
//       (`app/eleve/modules/codex/passation/[depotId]`,
//        `app/prof/codex/passation/[exerciceId]`,
//        `app/prof/codex/examen-diagnostique/[planifieId]`) : elles sont HORS de
//       ce lot (C4-L6 est clos), et elles sont nommées au relevé.
// ============================================================================

import { notFound } from 'next/navigation'
import { garderProf } from '@/utils/passation/garde'
import { chargerVueProf } from '@/utils/passation/vues'
import { EcranProf } from '@/components/passation/EcranProf'
import { lireLaPorteCopieAnnotee } from '@/utils/copie/porte'
import { chargerEntretienDeConception } from '@/utils/examens/entretien-serveur'
import EntretienConception from '@/components/passation/EntretienConception'

export default async function PassationAletheiaProf(
  { params }: { params: Promise<{ exerciceId: string }> },
) {
  const { exerciceId } = await params
  const { admin, actif } = await garderProf()
  const vue = await chargerVueProf(admin, exerciceId, actif)
  // La copie annotée (03/09) : à ON, la liste devient une liste de noms.
  const copieAnnotee = await lireLaPorteCopieAnnotee(admin)
  if (!vue) notFound()
  const entretien = await chargerEntretienDeConception(admin, exerciceId, vue.copies)
  return (
    <div className="mx-auto max-w-4xl p-4">
      <h1 className="font-cinzel text-xl text-encre">Passation en classe</h1>
      <p className="mt-1 text-sm text-muet">Aletheia — la lecture diagnostique</p>
      <div className="mt-6">
        <EntretienConception exerciceId={exerciceId} entretien={entretien} />
        <EcranProf vue={vue} baseCopie={copieAnnotee ? '/prof/aletheia/copie' : undefined} />
      </div>
    </div>
  )
}
