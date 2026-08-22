// ============================================================================
// C4 · L2 — LES OBSERVABLES REQUIS : le routeur LIT la fiche, il ne décide pas.
// ----------------------------------------------------------------------------
// « L'escalade exige au moins un observable REQUIS non acquis. Quels observables
//   sont requis, C'EST LA FICHE DE LA COMPÉTENCE QUI LE DÉCLARE
//   (`competences/<nom>.md`) : le routeur lit, il ne décide pas » (`01-` §8.3).
//
// D'où la forme de ce module : AUCUNE LISTE EN DUR. On reçoit le texte de la
// fiche — celui que la fabrique a déposé dans `competences_fiches.contenu`
// (`07-` §1.1, C4-L8) — et on en lit ce qu'il déclare.
//
// ⚠️ Ce n'est PAS la table de correspondance observable → formulation. Les deux
//    listes ne coïncident pas, et c'est délibéré : l'Expression donne un bloc de
//    correspondance à `reussites`, qui n'est pas requis ; le Questionnement en
//    donne à `recadrage_verbal` et `recadrage_non_tenu`, qui sont hors escalade ;
//    la Connaissance en donne sept alors qu'AUCUN de ses observables n'est requis.
//    Lire la correspondance à la place de la fiche escaladerait sur des
//    dimensions dont la fiche dit qu'elles ne comptent jamais.
//
// LA FORME QUE LES SIX FICHES PARTAGENT — c'est elle qu'on lit, et rien d'autre :
//   · une sous-section « ### Les observables pour la télémétrie du routeur »,
//     close par le « ### » suivant (la correspondance) ;
//   · dedans, une ou DEUX tables (la Synthèse en a deux : « les deux référents »
//     puis « le référent texte seulement ») dont la première cellule est un code
//     entre accents graves — c'est l'inventaire ;
//   · une phrase qui dit ce qui est requis, sous l'une de trois formes :
//       « Aucun n'est requis au sens de l'escalade »            → aucun ;
//       « Tous … sont requis …, sauf `x` » / « sauf deux : … »  → tous moins x ;
//       « … sont les sept premiers » + « `a` et `b` sont hors escalade ».
//
// ⚠️ Ce module ne CORRIGE jamais une fiche : quand ce qu'il lit ne se recoupe
//    pas (un ordinal annoncé qui ne tombe pas sur le compte), il le DIT — la
//    fiche fait foi, et un désaccord se signale au professeur.
// ============================================================================

/** Le titre de la sous-section, identique aux six fiches. */
const TITRE_TELEMETRIE = '### Les observables pour la télémétrie du routeur'

/** `01-` §8.3 — ce que la fiche déclare, plus ce qui n'a pas pu se recouper. */
export interface ObservablesDeLaFiche {
  /** L'inventaire, dans l'ordre de la table — c'est lui que « les N premiers » indexe. */
  tous: string[]
  /** Ceux que la précondition haute du §8.3 regarde. */
  requis: string[]
  /** Ceux que la fiche écarte nommément, avec la clause qui les écarte. */
  ecartes: string[]
  /** Ce qui n'a pas pu se lire ou se recouper — jamais corrigé en silence. */
  avertissements: string[]
}

export class FicheSansObservables extends Error {}

/** Les ordinaux que les fiches emploient — « les SEPT premiers ». */
const ORDINAUX: Record<string, number> = {
  un: 1, deux: 2, trois: 3, quatre: 4, cinq: 5, six: 6,
  sept: 7, huit: 8, neuf: 9, dix: 10, onze: 11, douze: 12, treize: 13,
}

/** Un code d'observable : ce que les tables et les clauses écrivent entre accents graves. */
const CODE = /`([a-z][a-z0-9_]*)`/g

/** Les codes d'un fragment de texte, dans l'ordre, sans doublon. */
function codesDe(fragment: string): string[] {
  const vus = new Set<string>()
  for (const m of fragment.matchAll(CODE)) vus.add(m[1])
  return [...vus]
}

/**
 * La sous-section « télémétrie du routeur » d'une fiche, close par le `###` suivant.
 * Lève quand la fiche ne la porte pas : une fiche sans inventaire ne dit rien de
 * ses requis, et deviner à sa place serait décider.
 */
export function sectionTelemetrie(contenuFiche: string): string {
  const debut = contenuFiche.indexOf(TITRE_TELEMETRIE)
  if (debut < 0) {
    throw new FicheSansObservables(
      `la fiche ne porte pas « ${TITRE_TELEMETRIE} » — l'inventaire des observables est introuvable.`)
  }
  const apres = debut + TITRE_TELEMETRIE.length
  const suivant = contenuFiche.indexOf('\n### ', apres)
  const fin = suivant < 0 ? contenuFiche.length : suivant
  return contenuFiche.slice(apres, fin)
}

/**
 * L'inventaire : la première cellule de chaque ligne de table qui porte un code
 * SEUL entre accents graves. L'en-tête (« | Observable | … ») et le séparateur
 * (« |---| ») n'en portent pas, ils tombent d'eux-mêmes.
 */
function inventaire(section: string): string[] {
  const codes: string[] = []
  for (const ligne of section.split('\n')) {
    if (!ligne.startsWith('|')) continue
    const premiere = ligne.slice(1).split('|')[0]?.trim() ?? ''
    const m = /^`([a-z][a-z0-9_]*)`$/.exec(premiere)
    if (m && !codes.includes(m[1])) codes.push(m[1])
  }
  return codes
}

/**
 * Ce que la fiche écarte. Deux clauses, et elles ne se lisent pas pareil :
 *   · « …, sauf `x` » — la phrase AFFIRME d'abord que tous sont requis, donc on
 *     ne prend que ce qui suit le « sauf » ;
 *   · « `a` et `b` sont hors escalade » — les codes PRÉCÈDENT la clause, on prend
 *     donc tout le paragraphe.
 * Dans les deux cas on croise avec l'inventaire : un `01-routeur.md` cité entre
 * accents graves dans la même phrase n'est pas un observable.
 */
function ecartesDe(section: string, tous: string[]): { ecartes: string[]; clauses: string[] } {
  const ecartes = new Set<string>()
  const clauses: string[] = []
  for (const paragraphe of section.split('\n')) {
    const bas = paragraphe.toLowerCase()
    const iSauf = bas.indexOf('sauf')
    let candidats: string[] | null = null
    if (iSauf >= 0) candidats = codesDe(paragraphe.slice(iSauf))
    else if (bas.includes('hors escalade')) candidats = codesDe(paragraphe)
    if (!candidats) continue
    const retenus = candidats.filter((c) => tous.includes(c))
    if (retenus.length === 0) continue
    retenus.forEach((c) => ecartes.add(c))
    clauses.push(paragraphe.trim())
  }
  return { ecartes: [...ecartes], clauses }
}

/** « Aucun n'est requis au sens de l'escalade » — la Connaissance, et elle seule aujourd'hui. */
function déclareAucunRequis(section: string): boolean {
  return /aucun\s+n['’]est\s+requis/i.test(section)
}

/** « sauf DEUX », « les SEPT premiers » — les comptes que la fiche annonce. */
function ordinalApres(section: string, motif: RegExp): number | null {
  const m = motif.exec(section)
  if (!m) return null
  const mot = m[1].toLowerCase()
  const n = ORDINAUX[mot] ?? Number.parseInt(mot, 10)
  return Number.isFinite(n) ? n : null
}

/**
 * `01-` §8.3 — ce que la fiche déclare requis.
 *
 * On ne rend jamais une liste inventée : soit la fiche se lit, soit ce qui n'a
 * pas pu se recouper part en avertissement, et le professeur tranche.
 */
export function observablesRequis(contenuFiche: string): ObservablesDeLaFiche {
  const section = sectionTelemetrie(contenuFiche)
  const tous = inventaire(section)
  const avertissements: string[] = []

  if (tous.length === 0) {
    throw new FicheSansObservables(
      'la sous-section « télémétrie du routeur » ne porte aucune ligne de table lisible.')
  }

  // Forme 1 — « Aucun n'est requis au sens de l'escalade ».
  if (déclareAucunRequis(section)) {
    return { tous, requis: [], ecartes: [...tous], avertissements }
  }

  // Formes 2 et 3 — tous requis, moins ce que la fiche écarte nommément.
  const { ecartes, clauses } = ecartesDe(section, tous)
  const requis = tous.filter((c) => !ecartes.includes(c))

  if (requis.length === 0) {
    avertissements.push(
      'la fiche écarte TOUS ses observables sans le dire par une clause « aucun n\'est requis » — '
      + `clauses lues : ${clauses.join(' / ')}`)
  }

  // Le recoupement — la fiche annonce parfois un compte, et il doit tomber juste.
  const combienEcartes = ordinalApres(section, /sauf\s+(\p{L}+)\s*:/iu)
  if (combienEcartes !== null && combienEcartes !== ecartes.length) {
    avertissements.push(
      `la fiche annonce « sauf ${combienEcartes} » et ${ecartes.length} observable(s) se lisent `
      + `nommément (${ecartes.join(', ') || 'aucun'}).`)
  }

  const combienRequis = ordinalApres(section, /(?:sont|est)\s+\*{0,2}les\s+(\p{L}+)\s+premiers/iu)
  if (combienRequis !== null) {
    if (combienRequis !== requis.length) {
      avertissements.push(
        `la fiche annonce « les ${combienRequis} premiers » et ${requis.length} observable(s) `
        + 'restent une fois les écartés retirés.')
    }
    const attendus = tous.slice(0, combienRequis)
    if (attendus.join('|') !== requis.join('|')) {
      avertissements.push(
        `la fiche annonce « les ${combienRequis} premiers » (${attendus.join(', ')}) et ce qui reste `
        + `n'est pas ce préfixe (${requis.join(', ')}).`)
    }
  }

  return { tous, requis, ecartes, avertissements }
}
