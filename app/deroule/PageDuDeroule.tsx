// ============================================================================
// C5 · L2 — L'ÉCRAN DU DÉROULÉ, PARTAGÉ PAR LES DEUX ATELIERS.
// ----------------------------------------------------------------------------
// ⭐⭐ LE DÉROULÉ EST GÉNÉRIQUE, ET IL L'ÉTAIT DÉJÀ. Sept composants, un chargeur
//    de 835 lignes, dix-neuf modules et un jeu d'actions partagé : **rien de
//    tout cela ne nomme Codex** — la seule chose qui l'y rangeait était LA
//    ROUTE, et son en-tête le disait : *« la lecture — même déroulé, retour
//    ancré au texte — est C5-L2 […] on ne route pas ce déroulé sous Aletheia, et
//    on ne le rend pas générique "au cas où". **Le lot qui en aura besoin le
//    fera sien.** »*
//
// ⛔ **CE FICHIER EST DANS `app/deroule/`, ET C'EST VOULU** : « un dossier sans
//    `page.tsx`, donc NON ROUTABLE […] il porte ce qui est PARTAGÉ par les
//    écrans du déroulé, où qu'ils vivent ». Deux pages qui recopieraient ce
//    corps seraient deux écrans à tenir d'accord.
//
// ⚠️ **PAS DE `<main>` IMBRIQUÉ.** Le layout élève en fournit déjà un, avec sa
//    colonne (`app/eleve/layout.tsx` : `max-w-[1040px]`). Les pages de passation
//    de C4-L4 en rouvrent un second, avec une autre largeur — **y compris
//    `app/eleve/modules/aletheia/passation/[depotId]/page.tsx`** : on ne
//    reproduit pas cet écart, et on ne la prend pas pour modèle.
//
// ⚠️ **LES ONGLETS SONT C5-L4** : cet écran n'en déclare aucun, et il ne touche
//    pas `components/nav/configModules.ts`.
// ============================================================================

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { garderEleveDeroule } from '@/utils/deroule/acces'
import { chargerLeDeroule } from '@/utils/deroule/vue'
import { EcranDeroule } from '@/components/deroule/EcranDeroule'
import type { Atelier } from '@/utils/codex-onglets/regles'

export async function PageDuDeroule(
  { atelier, depotId }: { atelier: Atelier; depotId: string },
) {
  const { admin, userId, ouvert, delaiVfJours } = await garderEleveDeroule()

  // ⚠️ QUATRE refus se ressemblent volontairement ici — pas à cet élève, pas de
  //    la maison, `retire`, ou **pas de cet atelier** : « introuvable » ne dit
  //    pas lequel. Le serveur, lui, le dit (`lireDepotMaison`).
  const vue = await chargerLeDeroule(admin, depotId, userId, { ouvert, delaiVfJours, atelier })
  if (!vue) notFound()

  // ⭐ Les avertissements sont pour le PROFESSEUR, pas pour l'élève : une trace
  //    serveur en tient lieu (`07-` §1.1 et §1.2) — « rien ne s'engendre à sa
  //    place », et rien ne s'affiche à l'élève non plus.
  for (const a of vue.avertissements) {
    console.warn(`[deroule] dépôt ${depotId} — ${a}`)
  }

  return (
    <div>
      <Link href={`/eleve/modules/${atelier}`}
        className="text-sm text-muet hover:text-encre-douce">
        ← Retour
      </Link>
      <div className="mt-4">
        <EcranDeroule vue={vue} />
      </div>
    </div>
  )
}
