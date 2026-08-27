// ============================================================================
// C4 · L3 — L'ÉCRAN DE L'ÉLÈVE, À LA MAISON : LA PORTE DE **CODEX**.
// (⭐ C5-L2 — son corps est parti dans `app/deroule/PageDuDeroule.tsx`, partagé
//  avec la porte d'Aletheia. Les deux routes ne diffèrent que par leur atelier.)
// ----------------------------------------------------------------------------
// ⚠️ **CETTE ROUTE EST CELLE DE L'ÉCRITURE**, et elle ne sert QUE cela depuis
//    C5-L2 : `atelier: 'codex'` borne le dépôt — *« Codex s'il porte `composer`,
//    Aletheia sinon »* (`01-` §2). **Avant, elle servait aussi un dépôt de
//    LECTURE à qui connaissait son identifiant.**
//
// ⭐ La lecture a désormais la sienne :
//    `app/eleve/modules/aletheia/exercice/[depotId]`.
// ============================================================================

import { PageDuDeroule } from '@/app/deroule/PageDuDeroule'

export default async function ExerciceMaisonCodex(
  { params }: { params: Promise<{ depotId: string }> },
) {
  const { depotId } = await params
  return <PageDuDeroule atelier="codex" depotId={depotId} />
}
