// ============================================================================
// C5 · L4 — LA CARTE QUI EXPLIQUE UN ÉCRAN VIDE, PARTAGÉE PAR LES TROIS ONGLETS.
// ----------------------------------------------------------------------------
// ⭐ Elle vivait dans `page.tsx`, où seule la racine s'en servait. Les trois
//    onglets rejouent les MÊMES quatre gardes de `contexteAletheia` — « un
//    onglet qu'on clique doit dire POURQUOI il refuse, jamais rendre une page
//    vide » —, donc les trois ont besoin de la même carte. ⛔ On ne la recopie
//    pas : trois exemplaires divergeraient au premier correctif.
//
// ⚠️ **ELLE SERT À DEUX ENDROITS QUI N'ONT PAS LE MÊME BESOIN, ET C'EST TOUT LE
//    POINT DE `avecRetour`.**
//
//  · aux **retours ANTICIPÉS** (module non activé, module indisponible), elle
//    EST la page : son « ← Retour » est **le seul**, et il doit rester — sans
//    lui, l'élève arrive sur une carte sans issue ;
//  · **DANS** la page, en revanche, le corps principal en rend déjà un en tête.
//    Elle affichait alors **DEUX « ← Retour »**, l'un sous l'autre.
//
// ⭐ Le défaut est ANCIEN — il date de C7·L2 — et il ne se voyait pas : les deux
//    liens se touchaient presque. Il est devenu visible quand C5-L2 a inséré la
//    liste des exercices de lecture entre eux, et c'est **le smoke élève du
//    27/08 qui l'a trouvé** : aucun test ne compte les liens d'une page.
//
// ⛔ Le retirer du composant aurait cassé les deux retours anticipés, où il est
//    la seule issue. C'est donc l'APPELANT qui déclare s'il en porte déjà un —
//    et les trois onglets le déclarent, chacun pour soi.
// ============================================================================

import Link from 'next/link'
import Pastille from '@/components/Pastille'

export default function CarteMessage(
  { children, avecRetour = true }: { children: React.ReactNode; avecRetour?: boolean },
) {
  const carte = (
    <div className="bg-surface border border-bordure rounded-xl p-8 flex flex-col items-center text-center">
      <span className="opacity-70"><Pastille module="aletheia" size={56} /></span>
      <p className="font-marque text-sm font-semibold tracking-[0.2em] text-pigment mt-3">ALETHEIA</p>
      <p className="font-corps text-sm text-encre-douce mt-2 max-w-sm">{children}</p>
    </div>
  )
  // Sans le retour, la carte est un bloc DANS une page qui a déjà sa colonne :
  // l'enveloppe `space-y-6 pb-8` est celle d'une page entière, pas d'un bloc.
  if (!avecRetour) return carte
  return (
    <div className="space-y-6 pb-8">
      <Link href="/eleve" className="text-sm text-muet hover:text-encre-douce">← Retour</Link>
      {carte}
    </div>
  )
}
