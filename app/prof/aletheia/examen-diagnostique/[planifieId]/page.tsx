// ============================================================================
// C4 · L9 — LA CONCEPTION D'UN EXAMEN DIAGNOSTIQUE, dans ALETHEIA.
// ----------------------------------------------------------------------------
// « Les sommatifs se conçoivent CHACUN DANS SON MODULE » (`02-` §6 B, citant le
//   `01-` §2). Cette route est MINCE — elle garde, elle appelle le chargeur
//   commun, elle rend le composant commun : un seul chargeur, un seul composant,
//   DEUX ENTRÉES, et le seul écart est ce que le professeur y choisit.
//
// ⚠️ ELLE EST CLÉE PAR LA LIGNE DE PLAN, pas par l'instance — « la ligne de plan
//    PRÉCÈDE l'exercice : elle porte la date, elle naît *à concevoir*, et c'est
//    ELLE qui appelle la conception » (`07-` §2, C4-L9).
//
// ⭐ C5-L4 — SA SEULE PORTE A CHANGÉ D'ONGLET, ELLE N'A PAS DISPARU.
//    `components/examens/EncartAConcevoir` (qui fabrique l'`href` à sa ligne 42)
//    était rendu en tête de `app/prof/aletheia/page.tsx` ; il vit désormais sous
//    l'onglet EXERCICES, avec le reste de ce qui touche un exercice de lecture.
//    ⚠️ L'encart REND `null` SUR LISTE VIDE, et la liste est vide quand la porte
//       du plan est fermée : une page nue n'est pas la preuve qu'il est cassé.
//    ⚠️ Elle reste hors de la barre — « un module = 2-3 onglets » (`AGENTS.md`).
//       C'est le `prefixes[]` d'Exercices qui garde l'onglet allumé ici.
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
import { garderProf } from '@/utils/fabrique/acces'
import { chargerConception } from '@/utils/examens/conception'
import EcranConceptionExamen from '@/components/examens/EcranConceptionExamen'

export const dynamic = 'force-dynamic'

export default async function ConceptionExamenAletheia(
  { params }: { params: Promise<{ planifieId: string }> },
) {
  const { planifieId } = await params
  const { admin, actif } = await garderProf()
  const vue = await chargerConception(admin, planifieId)
  // Une ligne d'un AUTRE module n'est pas « introuvable » par hasard : chaque
  // module ne conçoit que le sien.
  if (!vue || vue.module !== 'aletheia') notFound()
  return (
    <div className="mx-auto max-w-3xl p-4">
      <EcranConceptionExamen vue={vue} actif={actif} />
    </div>
  )
}
