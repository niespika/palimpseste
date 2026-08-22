// ============================================================================
// C4 · L3 — LE RENDU DU BALISAGE RESTREINT : gras et italique, rien d'autre.
// ----------------------------------------------------------------------------
// ⭐ DÉCISION DE LOUIS (piège 36) : « **le balisage markdown des 336 consignes
//    SE REND à l'écran.** Il ne se nettoie pas : **le gras est du SENS, pas de
//    la décoration**. Coût assumé : un rendu markdown **restreint — gras et
//    italique seulement** — dans l'écran élève. »
//
// ⚠️ **AUCUN `dangerouslySetInnerHTML`.** Le module pur `baliser()` rend des
//    JETONS ; ce composant les met en `<strong>` / `<em>`. Il n'y a donc
//    **aucune surface d'injection**, et c'est ce qui compte : une consigne vient
//    d'un fichier importé, donc d'une source qu'on ne contrôle pas entièrement.
//    Le dépôt entier ne porte aucune occurrence d'`innerHTML` — on n'en
//    introduit pas la première ici.
//
// ⚠️ **CE RENDU S'APPLIQUE À LA CONSIGNE SEULE.** Le matériau, le guide et le
//    texte d'auteur « s'affichent TELS QU'ILS SONT STOCKÉS » (piège 33 de
//    C4-L8) : ils restent en `whitespace-pre-wrap` brut, et `TexteBrut`
//    ci-dessous est là pour qu'on n'ait jamais la tentation de les baliser.
// ============================================================================

import { baliser, type Jeton } from '@/utils/deroule/balisage'

export function TexteBalise(
  { jetons, className = '' }: { jetons: readonly Jeton[]; className?: string },
) {
  return (
    <span className={className}>
      {jetons.map((j, i) => {
        if (j.type === 'saut') return <br key={i} />
        if (j.type === 'gras') return <strong key={i}>{j.texte}</strong>
        if (j.type === 'italique') return <em key={i}>{j.texte}</em>
        if (j.type === 'gras_italique') return <strong key={i}><em>{j.texte}</em></strong>
        return <span key={i}>{j.texte}</span>
      })}
    </span>
  )
}

/** Le raccourci, quand on n'a que la chaîne sous la main. */
export function Balise({ source, className }: { source: string; className?: string }) {
  return <TexteBalise jetons={baliser(source)} className={className} />
}

/**
 * ⚠️ Le contraire : **tel qu'il est stocké**, sauts compris, sans balisage.
 * C'est ce que le matériau, le guide et le texte d'auteur reçoivent.
 */
export function TexteBrut({ texte, className = '' }: { texte: string; className?: string }) {
  return <p className={`whitespace-pre-wrap ${className}`}>{texte}</p>
}
