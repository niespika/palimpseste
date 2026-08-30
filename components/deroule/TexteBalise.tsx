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
//
// ⭐⭐ C4-L15 — ET MARQUER N'EST PAS BALISER : LA RÈGLE CI-DESSUS TIENT ENTIÈRE.
//    Depuis le 24/08, l'écran met en évidence, DANS LE MATÉRIAU, les candidats
//    servis au cran 1 et le passage fautif aux crans 3 et 5 (`02-` §5). Ce
//    n'est PAS du balisage, et les deux règles cohabitent sans se contredire :
//    · baliser INTERPRÈTE des caractères de la consigne — `**x**` devient du
//      gras, et les astérisques disparaissent ;
//    · marquer N'INTERPRÈTE AUCUN CARACTÈRE du matériau — il ne lit pas de
//      `**`, il ne retire rien, il n'ajoute rien. Il calcule des BORNES à
//      partir d'AILLEURS (les candidats servis, le diff avec la version
//      corrigée), et **le texte reste octet pour octet ce que la base porte** :
//      la concaténation des segments EST le matériau.
//    `MateriauMarque` ci-dessous rend ces segments — même `whitespace-pre-wrap`
//    que `TexteBrut`, et **aucun HTML fabriqué** : c'est React qui met en
//    `<strong>`, donc il n'y a toujours aucune surface d'injection.
// ============================================================================

import { baliser, type Jeton } from '@/utils/deroule/balisage'
import type { SegmentMateriau } from '@/utils/deroule/marquage'

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
 * C'est ce que le guide et le texte d'auteur reçoivent — et le matériau, aux
 * crans où l'écran n'y met rien en évidence.
 */
export function TexteBrut({ texte, className = '' }: { texte: string; className?: string }) {
  return <p className={`whitespace-pre-wrap ${className}`}>{texte}</p>
}

/**
 * ⭐ C4-L15 — LE MATÉRIAU, AVEC CE QUE L'ÉCRAN Y MET EN ÉVIDENCE (`02-` §5).
 *
 * Le même `whitespace-pre-wrap` que `TexteBrut` : le matériau reste « tel qu'il
 * est stocké », sauts compris. **Ce qui change n'est pas le texte, c'est ce
 * qu'on en montre.**
 *
 * ⚠️ LE RENDU ATTENDU EST LE GRAS, ET LA CONSIGNE L'A DÉJÀ PROMIS : deux
 * consignes du `04-` s'y appuient — `mot_impropre` dit « les mots en gras dans
 * le texte » au cran 1 et « le mot en gras » au cran 3. **Note le nombre** :
 * PLURIEL au cran 1 (les quatre candidats), SINGULIER au cran 3 (un seul
 * passage fautif). Une consigne servie à l'élève promet quelque chose que cet
 * écran doit tenir — marquer autrement, ou marquer plusieurs passages au cran
 * 3, ferait MENTIR la consigne.
 *
 * ⭐⭐ ET LE MOT EST **ENTOURÉ**, EN PLUS D'ÊTRE EN GRAS — décision de Louis,
 * 24/08, après la recette R1 à l'écran. **Le motif est un défaut vu par l'œil et
 * par lui seul** : au cran 1, deux candidats VOISINS dans le texte — `donc` et
 * `meilleure` — donnaient bien DEUX `<strong>` dans le DOM, mais se lisaient
 * comme **un seul bloc gras**. ⛔ La consigne, elle, annonce « ces QUATRE mots
 * en gras » : l'élève en comptait trois. *Aucun test, aucun smoke serveur,
 * aucune revue de code ne pouvait le poser — il fallait le voir.*
 *
 * ⚠️ **LE GRAS RESTE, ET IL LE FAUT** : « les mots **en gras** dans le texte »
 * (cran 1) et « le mot **en gras** » (cran 3) sont écrits dans des consignes
 * SERVIES À L'ÉLÈVE (`02-` §5). Entourer À LA PLACE de mettre en gras ferait
 * mentir la consigne. **On entoure EN PLUS.**
 *
 * ⭐ Le cadre sépare deux marques contiguës parce que **l'espace qui les sépare
 * est un `<span>` HORS des deux boîtes** : deux voisins rendent deux cadres
 * distincts, jamais un seul.
 *
 * Le cadre prend le **pigment du module** (`globals.css`) — jamais un hex en
 * dur —, et `box-decoration-clone` lui fait refermer sa boîte de chaque côté
 * d'un retour à la ligne, au lieu d'un cadre ouvert à cheval sur deux lignes.
 *
 * ⛔ Aucun HTML n'est fabriqué ici : les segments sont du texte NU, et React
 * les échappe. Le matériau vient d'un import de fichier (`08-` §4).
 */
export function MateriauMarque(
  { segments, className = '', marque = MARQUE }:
  { segments: readonly SegmentMateriau[]; className?: string; marque?: string },
) {
  return (
    <p className={`whitespace-pre-wrap ${className}`}>
      {segments.map((s, i) => (
        s.marque
          ? <strong key={i} className={marque}>{s.texte}</strong>
          : <span key={i}>{s.texte}</span>
      ))}
    </p>
  )
}

/**
 * ⭐ LE RENDU D'UNE MARQUE, EN UN SEUL ENDROIT — l'écran élève et l'aperçu du
 * professeur l'importent tous les deux. *« Le professeur doit voir ce que
 * l'élève verra » : deux listes de classes qui divergeraient rendraient cette
 * phrase fausse au premier ajustement.*
 */
/**
 * ⭐⭐ **DEUX SURLIGNAGES, JAMAIS CONFONDUS** — handoff « Codex Exercices
 * (élève) » §2. Ils désignent des choses de nature opposée :
 *   · `MARQUE` — **ce que l'ÉCRAN met en évidence** : les quatre candidats du
 *     cran 1, le passage fautif aux crans 3 et 5, la sélection que le
 *     professeur a faite dans le texte d'auteur. Fond `--attention-teinte`,
 *     filet bas `--filet-servi` ;
 *   · `MARQUE_ELEVE` — **ce que l'ÉLÈVE a désigné** aux crans 4, 7 et 9. Fond
 *     `--pigment-teinte`, filet bas de 2 px au pigment du module.
 * *Les rendre pareils ferait croire à l'élève qu'il a surligné ce qu'on lui
 * avait déjà surligné — et, aux crans où il doit trouver seul, que le travail
 * est fait.*
 *
 * ⭐⭐ **LE CADRE DU 24/08 EST TENU PAR LE FOND, ET IL FAUT QUE ÇA RESTE VRAI.**
 * La décision de Louis venait d'un défaut vu à l'œil : au cran 1, deux candidats
 * VOISINS — `donc` et `meilleure` — donnaient deux `<strong>` dans le DOM mais
 * **se lisaient comme un seul bloc gras**, et l'élève en comptait trois là où la
 * consigne en promet quatre. Ici, l'espace qui sépare deux marques est un
 * `<span>` HORS des deux boîtes : il reste SANS FOND, et les deux pastilles se
 * détachent l'une de l'autre. `box-decoration-clone` referme la boîte de chaque
 * côté d'un retour à la ligne, au lieu d'un cadre ouvert à cheval sur deux lignes.
 *
 * ⚠️ **LE GRAS RESTE, ET IL LE FAUT** : « les mots **en gras** dans le texte »
 * (cran 1) et « le mot **en gras** » (cran 3) sont écrits dans des consignes
 * SERVIES À L'ÉLÈVE (`02-` §5). Le retirer ferait mentir la consigne.
 *
 * ⭐ Les deux se posent en JETONS (`globals.css`), jamais en hex : elles suivent
 * donc le monde du module sans une ligne de plus.
 */
export const MARQUE = 'font-semibold rounded-[0.2em] bg-attention-teinte '
  + 'shadow-[inset_0_-1px_0_var(--filet-servi)] px-[0.18em] box-decoration-clone'

export const MARQUE_ELEVE = 'font-semibold rounded-[0.2em] bg-pigment-teinte '
  + 'shadow-[inset_0_-2px_0_var(--pigment)] px-[0.18em] box-decoration-clone'
