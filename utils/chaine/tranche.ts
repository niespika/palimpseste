// ============================================================================
// C5 · L3 — LA TRANCHE DE RÉFÉRENCE : CE QUE CHAQUE COMPÉTENCE LIT, ET RIEN DE PLUS.
// ----------------------------------------------------------------------------
// « C'est par ces intervalles que la Phase 2 reçoit sa TRANCHE DE RÉFÉRENCE »
// (`02-` §6 A). Le mot n'était défini nulle part ; **Louis l'a tranché le
// 26/08**, en clôture de C5-L1 : la tranche est **la part de la RÉFÉRENCE servie
// à la Phase 2**, jamais un segment du livre (`07-` §2, v2.54).
//
// ⭐ LA RÈGLE QUE CE MODULE APPLIQUE EST CELLE DU `05-` §1, ET ELLE TIENT EN UNE
//    PHRASE : « **on ne passe à un consommateur que ce que sa règle lit** ».
//    La brique qui l'applique existe et est éprouvée depuis C5-L1 —
//    `valeursServies()` de `utils/generateur/lecture.ts`, 24 vecteurs verts — et
//    **elle n'avait aucun consommateur de production** : seuls ses tests et le
//    script de recette de C5-L1 l'appelaient. Ce module est son consommateur.
//
// ⛔ CE QU'IL N'EST PAS. Ce n'est **pas un second contrôle du format** — celui
//    qui fait foi est `controleReference` (`utils/fabrique/verifie-reference.ts`,
//    41 vecteurs), et les quatre listes fermées ne s'y recopient qu'UNE FOIS.
//    Ce n'est **pas une seconde échelle de sélection** : la borne de l'extrait
//    est C5-L1, et « la borne de la classe n'est pas la sienne ». Ce n'est **pas
//    une segmentation** : `phrasesDuTexte` fait foi, et les intervalles **se
//    dérivent à la lecture et ne se stockent JAMAIS** (dette D8).
//
// ⚠️ L'ASYMÉTRIE DE `valeursServies` EST VOULUE, ET C'EST ELLE QUI BOUCHE LE
//    TROU. Une valeur **déclarée au `02-`** que la règle ne lit pas est écartée
//    **en silence** — « une valeur nouvelle est INERTE tant qu'aucune règle ne
//    la lit ». Une valeur **NON déclarée au `02-`** atteint quand même le
//    consommateur **et lève une alerte** — « c'est un vrai défaut, et il doit se
//    voir ». ⛔ *Ne symétrise pas ces deux branches.*
//
// ⭐⭐ LE CAS D'AUJOURD'HUI EST NOMMÉ PAR LE `05-` §1 LUI-MÊME, ET IL EST EN BASE.
//    « Une phrase dont `relance` est la SEULE fonction ne porte aucun contenu à
//    restituer et n'est donc pas une unité pour la Synthèse. » *Mesuré le 27/08 :
//    la référence validée du bac à sable porte **17 phrases, dont 4 dont
//    `relance` est la seule fonction**.* Sans règle de lecture, chacune de ces
//    quatre coûtait au module **DEUX alertes** — « fonction inconnue « relance » »
//    puis « aucune fonction lisible » — et **la première était fausse** :
//    `relance` n'est pas inconnue, elle est **déclarée au `02-` et non lue par ce
//    consommateur**. La règle l'écarte en silence, comme l'asymétrie le prescrit ;
//    la seconde alerte demeure, et elle est juste — cette unité n'a rien à
//    restituer. *C'est la dette `C4L10SY-21`, bouchée sans toucher à la fiche.*
//
// ⛔ ON NE RETIRE PAS L'UNITÉ, ON RETIRE CE QUE LA RÈGLE NE LIT PAS. Retirer la
//    phrase de `phrases[]` aurait fait mentir les MOMENTS, dont l'intervalle
//    `de..a` est garanti « contigu, sans trou ni chevauchement » par le
//    validateur, et que `normaliserReference` déplie en unités. *Le format n'est
//    pas à nous ; ce qui est à nous, ce sont les valeurs qu'on sert.*
// ============================================================================

import { valeursServies, type RegleDeLecture } from '../generateur/lecture'
import type { InstrumentCompetence } from './instruments'
import type { Competence } from './types'

/**
 * La règle de lecture d'une compétence — **déclarée, jamais devinée**.
 *
 * ⭐ « Un champ absent veut dire *il lit tout ce que le `02-` déclare* — on ne
 *    retranche que ce qu'un consommateur a NOMMÉ » (`lecture.ts`). Une
 *    compétence absente de cette table reçoit donc la référence entière, et
 *    c'est le comportement d'avant ce lot : **ce module ne retranche rien qu'une
 *    règle n'ait demandé.**
 *
 * ⚠️ SEULES DEUX COMPÉTENCES LISENT LA RÉFÉRENCE, et ce n'est pas un oubli :
 *    `FOURNISSEURS_NATIFS` la sert à toutes, mais seuls le Questionnement
 *    (`armatureDe`) et la Synthèse (`referenceDuContexte`) la reparsent. Les
 *    quatre autres ne la regardent pas — leur donner une règle serait déclarer
 *    une lecture qui n'existe pas.
 */
export function regleDeLecture(
  competence: Competence, instrument: InstrumentCompetence | null,
): RegleDeLecture | null {
  if (competence === 'synthese') {
    // ⭐⭐ LA RÈGLE DE LA SYNTHÈSE NE S'INVENTE PAS : ELLE SE LIT SUR SA FICHE.
    //    Le volet `squelette.catalogue` du bloc machine déclare
    //    `fonctions_reference` — « les fonctions de phrase que cet instrument
    //    lit » —, et la dérivation l'a versé. *Recopier cette liste ici lui
    //    donnerait un second domicile, et « une liste fermée qui vit à deux
    //    endroits diverge ».*
    const lues = fonctionsReferenceDe(instrument)
    if (!lues) return null
    return {
      fonctionsPhrase: lues,
      // ⛔ LES STATUTS ET LES FONCTIONS DE MOMENT NE SE RETRANCHENT PAS. Le juge
      //    lit la référence ENTIÈRE par `document_p2` : « c'est là qu'il prend le
      //    STATUT D'ÉNONCIATION dont le §4 dit qu'il en a les moyens ». Les
      //    retrancher lui ferait juger la fidélité sans ce qui la décide.
    }
  }
  if (competence === 'questionnement') {
    // ⭐ LE QUESTIONNEMENT NE LIT QU'UN CHAMP, ET LA FICHE LE DIT EN TOUTES
    //    LETTRES : le référent de `question_specifique` en réception est « son
    //    champ `armature.question_directrice`, et **le module n'en lit aucun
    //    autre** » (fiche §4). Il ne lit donc **aucune** fonction de phrase,
    //    **aucune** fonction de moment, **aucun** statut d'énonciation.
    // ⚠️ `armature` n'est pas une unité : `valeursServies` ne la touche pas, et
    //    elle descend donc intacte. *La règle retranche ce qui est inerte pour ce
    //    consommateur, jamais ce qu'il lit.*
    return { fonctionsPhrase: [], fonctionsMoment: [], statuts: [] }
  }
  return null
}

/** `bloc_machine.squelette.catalogue.fonctions_reference`, tel que la dérivation l'a versé. */
function fonctionsReferenceDe(instrument: InstrumentCompetence | null): readonly string[] | null {
  const squelette = (instrument?.bloc_machine as Record<string, unknown> | undefined)?.squelette
  if (!squelette || typeof squelette !== 'object') return null
  const catalogue = (squelette as Record<string, unknown>).catalogue
  if (!catalogue || typeof catalogue !== 'object') return null
  const lues = (catalogue as Record<string, unknown>).fonctions_reference
  if (!Array.isArray(lues)) return null
  const propres = lues.filter((f): f is string => typeof f === 'string')
  return propres.length ? propres : null
}

export interface TrancheServie {
  /** La référence telle que ce consommateur la reçoit. */
  reference: unknown
  /**
   * ⚠️ CE QUI DOIT SE VOIR — les alertes de `valeursServies`, remontées telles
   *    quelles. Elles ne signalent QUE le cas asymétrique : une valeur que le
   *    `02-` §6 A ne déclare pas, qui atteint quand même le consommateur.
   */
  alertes: string[]
  /**
   * Ce que la règle a écarté, par unité — **le journal de l'exclusion**. Vide
   * quand aucune règle ne s'applique. *Il ne part pas en alerte : une exclusion
   * par règle est le fonctionnement normal, pas un défaut.*
   */
  ecarte: Array<{ ou: string; valeurs: string[] }>
}

/**
 * ⭐⭐ LA TRANCHE — la référence restreinte à ce que la règle du consommateur lit.
 *
 * Rend la référence **telle quelle** quand aucune règle n'est déclarée, et
 * **jamais** `null` sur une référence servie : retrancher n'est pas refuser.
 *
 * ⚠️ ELLE NE TOUCHE QUE `phrases[]` ET `moments[]` — les deux porteurs d'unités
 *    du format. `concepts`, `lectures`, `armature` et `hesitation` traversent
 *    intacts : ce ne sont pas des unités, et `valeursServies` ne les lit pas.
 */
export function trancheDeReference(
  reference: unknown, competence: Competence, instrument: InstrumentCompetence | null,
): TrancheServie {
  const regle = regleDeLecture(competence, instrument)
  if (regle === null || !estObjet(reference)) return { reference, alertes: [], ecarte: [] }

  const alertes: string[] = []
  const ecarte: Array<{ ou: string; valeurs: string[] }> = []
  const sortie: Record<string, unknown> = { ...reference }

  if (Array.isArray(reference.phrases)) {
    sortie.phrases = reference.phrases.map((p) => {
      if (!estObjet(p)) return p
      const servies = valeursServies(p, regle)
      alertes.push(...servies.alertes)
      const avant = listeDeChaines(p.fonctions)
      const perdues = avant.filter((f) => !servies.fonctionsPhrase.includes(f))
      const statutsAvant = listeDeChaines(p.statuts)
      const statutsPerdus = statutsAvant.filter((s) => !servies.statuts.includes(s))
      if (perdues.length || statutsPerdus.length) {
        ecarte.push({ ou: `phrase ${String(p.n)}`, valeurs: [...perdues, ...statutsPerdus] })
      }
      const sortiePhrase: Record<string, unknown> = { ...p }
      if (p.fonctions !== undefined) sortiePhrase.fonctions = servies.fonctionsPhrase
      if (p.statuts !== undefined) sortiePhrase.statuts = servies.statuts
      return sortiePhrase
    })
  }

  if (Array.isArray(reference.moments)) {
    sortie.moments = reference.moments.map((m) => {
      if (!estObjet(m)) return m
      const servies = valeursServies(m, regle)
      alertes.push(...servies.alertes)
      const avant = typeof m.fonction === 'string' ? [m.fonction] : []
      const perdues = avant.filter((f) => !servies.fonctionsMoment.includes(f))
      const statutsAvant = listeDeChaines(m.statuts)
      const statutsPerdus = statutsAvant.filter((s) => !servies.statuts.includes(s))
      if (perdues.length || statutsPerdus.length) {
        ecarte.push({ ou: `moment ${String(m.m)}`, valeurs: [...perdues, ...statutsPerdus] })
      }
      const sortieMoment: Record<string, unknown> = { ...m }
      // ⛔ UNE FONCTION DE MOMENT ÉCARTÉE DEVIENT ABSENTE, JAMAIS VIDE. Le format
      //    déclare `fonction` au SINGULIER — une chaîne, pas une liste : lui
      //    servir `[]` changerait son type sous le consommateur. *« Une clé
      //    absente et une clé vide ne disent pas la même chose. »*
      if (m.fonction !== undefined) {
        if (servies.fonctionsMoment.length) [sortieMoment.fonction] = servies.fonctionsMoment
        else delete sortieMoment.fonction
      }
      if (m.statuts !== undefined) sortieMoment.statuts = servies.statuts
      return sortieMoment
    })
  }

  return { reference: sortie, alertes, ecarte }
}

function estObjet(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function listeDeChaines(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []
}
