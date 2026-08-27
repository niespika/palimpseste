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
// ⛔ **CE N'EST PAS UN ONGLET** — Aletheia n'a toujours aucun `sousOngletsEleve`,
//    et c'est `C5-L4` qui les pose. Une route et une liste, rien de plus.
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
