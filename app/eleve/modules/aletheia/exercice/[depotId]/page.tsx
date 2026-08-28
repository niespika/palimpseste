// ============================================================================
// C5 · L2 — L'ÉCRAN DE L'ÉLÈVE, À LA MAISON : LA PORTE D'**ALETHEIA**.
// ----------------------------------------------------------------------------
// ⭐⭐ LA ROUTE QUI MANQUAIT. « Le même déroulé qu'à l'écrit » (`06-` §2) : cette
//    route ne construit RIEN — elle sert l'écran générique de C4-L3, borné à
//    l'atelier de la LECTURE.
//
// ⚠️ **UN EXERCICE DE LECTURE ASSIGNÉ ÉTAIT INTROUVABLE.** Il n'avait ni lien,
//    ni liste, ni adresse : `exercicesMaisonDeLEleve` filtrait sur
//    `atelierDUnFormatif(...) === 'codex'`, et la page élève d'Aletheia ne rend,
//    du moteur, que les passations de CLASSE. *« Un écran sans porte n'existe
//    pas »* (`07-` §2).
//
// ⭐ **C5-L4 A POSÉ L'ONGLET, ET CETTE ROUTE N'EN EST TOUJOURS PAS UN.** La
//    liste que C5-L2 avait posée sur la racine élève vit désormais sous l'onglet
//    EXERCICES (`app/eleve/modules/aletheia/exercices/page.tsx`) ; c'est lui qui
//    mène ici, et c'est son `prefixes[0]` — `/eleve/modules/aletheia/exercice`,
//    AU SINGULIER — qui garde l'onglet allumé quand on y entre.
//    ⚠️ L'onglet est `…/exercices`, AU PLURIEL : les deux chaînes sont à une
//       lettre l'une de l'autre, et `ongletActifParRoute` les sépare sans
//       ambiguïté (`utils/codex-onglets/onglets-aletheia.test.ts` le tient).
//
// ⚠️ Le layout d'Aletheia est symétrique de celui de Codex
//    (`<div data-module="aletheia"><TuileAccentModule>`) : rien n'y bloque une
//    route imbriquée, et l'écran hérite du pigment du module sans un mot de plus.
// ============================================================================

import { PageDuDeroule } from '@/app/deroule/PageDuDeroule'

export default async function ExerciceMaisonAletheia(
  { params }: { params: Promise<{ depotId: string }> },
) {
  const { depotId } = await params
  return <PageDuDeroule atelier="aletheia" depotId={depotId} />
}
