// ============================================================================
// C4 · L8 — LA DOCTRINE, lue en base et assemblée.
// ----------------------------------------------------------------------------
// « Ne recopie aucune de ces tables à la main, ni dans le code ni dans un seed
//   tapé […] Dérive-les des sources par un script » (piège 38 ; `07-` §2 :
//   « ce que la fabrique lit de ces deux-là, elle le DÉRIVE des fichiers, elle
//   ne le recopie pas »).
//
// Ce module ne DÉRIVE rien : il ASSEMBLE. La dérivation vit dans
// `scripts/derive-doctrine.py`, qui lit les sources de l'autre dépôt par
// `generateur/noyau/doctrine.py` et son crible « cite ou refuse », et verse les
// lignes en base. Ici, un seul chemin d'assemblage — `assemblerDoctrine(rows)` —
// nourri de deux façons :
//   · en production, par les tables (`chargerDoctrineDepuisBase`) ;
//   · au test, par `doctrine.fixture.json`, qui est une SORTIE du même script.
// Un seul assemblage, donc rien qui puisse diverger entre le test et l'écran.
//
// ⚠️ C4 · L8-bis — LA LECTURE SE PAGINE, ET ELLE SE CONTRÔLE. Une réponse
// PostgREST est plafonnée à mille lignes sans rien signaler ; `exercices_routes`
// en porte 3264. Sept objets sur treize se sont ainsi affichés SANS AUCUNE
// ROUTE — banque de consignes vide, choix obligatoire, objet inconcevable —
// pendant que la garde serveur et le contrôle d'import refusaient « non routé »
// des observables pourtant routés. Les lignes étaient en base : c'est la lecture
// applicative qui plafonnait, et `derive-doctrine.py --verifie` ne pouvait pas
// le voir, puisqu'il lit les SOURCES. D'où `lireTable` — les douze tables, par
// un seul chemin, ordonnées, paginées, et confrontées au décompte de la base.
//
// ⚠️ AUCUNE VALEUR DE DOCTRINE N'EST ÉCRITE DANS CE FICHIER. Les seules
// constantes sont l'identité du FORMAT D'IMPORT (`08-` §1), que la plateforme
// doit connaître pour dire si elle sait lire un fichier — et « le MAJEUR seul
// décide ; le mineur n'est lu par personne ».
// ============================================================================

/** `08-` §1, l'en-tête du fichier d'import. Le majeur seul décide. */
export const FORMAT_IMPORT = 'palimpseste/import-exercices'
export const VERSION_IMPORT = '1.1'

export const MODES = ['composer', 'restituer', 'expliquer', 'évaluer', 'interroger'] as const
export const COMPETENCES = ['expression', 'argumentation', 'structure',
  'connaissance', 'synthese', 'questionnement'] as const
/** `08-` §5.1 — les cinq provenances, `null` compris. */
export const PROVENANCES = [null, 'genere', 'sujet', 'production_eleve', 'texte_auteur'] as const
export const SUPPORTS = [null, 'mot', 'phrase', 'extrait', 'texte'] as const
export const LIEUX = ['maison', 'classe'] as const

export type Mode = (typeof MODES)[number]
export type Competence = (typeof COMPETENCES)[number]

// ── Les lignes, telles que la base les porte ────────────────────────────────

export interface LignesDoctrine {
  exercices_types: Array<{
    code: string; nature: string; grain: string | null; libelle: string | null
    supports_source: string[]; genres_admis: string[] | null
    competences: string[]; crans_admis: Array<string | number>
    exclusions_parcours: string[]; modes_objet?: string[]
  }>
  exercices_types_modes: Array<{ objet_code: string; competence: string; modes: string[] }>
  exercices_types_modes_source: Array<{
    objet_code: string; mode: string
    provenances_admises: string[]; supports_admis: string[]
  }>
  exercices_types_crans: Array<{
    objet_code: string; cran: number | string
    couverture_observables: unknown; provenances_admises_cible: string[]
    duree_exercice_min: number
  }>
  exercices_crans: Array<{
    cran: number; code: string; geste: string; appui: string; fait: string
    palier_vise: string; materiau_cible: string; defaut: string
    distracteurs: string; reponse_attendue: string; guide: string
    jugement: string; couverture_observables: string; regime_v1vf: string
  }>
  exercices_durees: Array<{ geste: string; grain: string; borne_min: number; borne_max: number; duree_min: number }>
  competences_modes_admis: Array<{ competence: string; mode: string }>
  exercices_routes: Array<{
    objet_code: string; mode: string; cran: number; competence: string
    observable_code: string; observable_nom: string
    source_fichier: string; source_section: number
  }>
  exercices_consignes_isolees: Array<{
    competence: string; source_section: number; cran: number
    observable_nom: string; observable_code_composition: string
    observable_code_reception: string; defaut_injecte: string
    appui: string; consigne: string
  }>
  exercices_consignes_production: Array<{ mode: string; cran: number; patron: string }>
  exercices_guides_production: Array<{
    objet_code: string; genre: string | null; figure: string | null
    guide_cran2: string | null; guide_cran6: string | null
  }>
  demonstrations_formes: Array<{ forme: string; grain: string }>
}

// ── La doctrine assemblée ───────────────────────────────────────────────────

export interface ObjetDoctrine {
  code: string
  libelle: string
  nature: string
  grain: string
  /** La PLAGE admise de `support_source` — « c'est le plus étroit d'entre eux
   *  qui borne l'`englobant` », et il borne l'englobant, PAS la sélection. */
  supportSource: string[]
  /** `[]` quand le `genre` est `null` — les dix objets non terminaux. */
  genres: string[]
  competences: string[]
  /** Les `modes[]` de l'objet, déclarés au `04-`, bornés par le `02-` §3. */
  modes: string[]
  crans: Set<number>
  exclusionsParcours: string[]
  /** Le `materiau_source` par mode — `04-` §0, « la même sur les neuf crans ». */
  sourceParMode: Record<string, { provenances: string[]; supports: string[] }>
  /** Par cran admis : couverture, provenances de la cible, durée. */
  parCran: Record<number, {
    couverture: unknown
    provenancesCible: string[]
    dureeMin: number
  }>
}

export interface CranDoctrine {
  n: number
  code: string
  geste: 'diagnostiquer' | 'transformer' | 'produire'
  appui: string
  fait: string
  palierVise: string
  materiauCible: 'présent' | 'null' | 'présent ou null'
  defaut: 'présent' | 'null'
  distracteurs: 'présent' | 'null'
  reponseAttendue: 'présent' | 'null'
  guide: 'null' | 'complet' | 'léger'
  jugement: 'algorithmique' | 'IA'
  couverture: 'isole' | 'exerce'
  regimeV1vf: string
  /** `isole` aux six crans qui isolent, `exerce` aux trois de production. */
  isole: boolean
}

export interface RouteDoctrine {
  objet: string
  mode: string
  competence: string
  code: string
  nom: string
  fichier: string
  section: number
  /** Les crans qui isolent où cet observable est servable, pour ce couple. */
  crans: number[]
}

export interface Doctrine {
  objets: Record<string, ObjetDoctrine>
  crans: Record<number, CranDoctrine>
  modesAdmis: Record<string, string[]>
  durees: Record<string, { min: number; max: number; valeur: number }>
  /** Indexé par `${objet}|${mode}` — l'accès qu'a `doctrine.routes` en Python. */
  routes: Record<string, RouteDoctrine[]>
  /** Indexé par `${competence}|${section}` → { cran → { appui, consigne } }. */
  consignesIsolees: Record<string, Record<number, { appui: string; consigne: string }>>
  /** Le bloc d'un observable : son défaut injecté, son nom, ses codes. */
  observables: Record<string, {
    competence: string; section: number; nom: string
    codeComposition: string; codeReception: string; defautInjecte: string
  }>
  /** Indexé par `${mode}|${cran}` — les quinze patrons du `04-` §14.1. */
  consignesProduction: Record<string, string>
  /** Indexé par `${objet}` puis `${objet}|${genre}` — le `04-` §14.2. */
  guidesProduction: Record<string, {
    figure: string | null; cran2: string | null; cran6: string | null
  }>
  /** L'appariement forme × grain du `06-` §2 — un SIGNALEMENT, jamais un refus. */
  formesDemonstration: Record<string, string>
}

export class DoctrineAbsente extends Error {}

/**
 * C4 · L8-bis — la doctrine lue EN PARTIE, ce qui est pire que pas lue du tout.
 *
 * Une doctrine vide ACCEPTE tout ; une doctrine tronquée REFUSE ce qui est
 * licite, avec le motif de la source — « l'observable n'est routé ni pour cet
 * objet, ni pour ce mode, ni pour ce cran » (`08-` §7.1, refus n° 15) alors que
 * la route existe en base. C'est le pire des silences : le message accuse la
 * doctrine, et c'est la lecture qui a menti.
 *
 * Elle hérite de `DoctrineAbsente` parce qu'elle se traite comme elle : rien ne
 * l'attrape dans les quatre chemins qui chargent la doctrine, et son message
 * remonte tel quel à l'écran.
 */
export class DoctrineTronquee extends DoctrineAbsente {}

const entier = (x: unknown): number =>
  typeof x === 'number' ? x : Number.parseInt(String(x), 10)

/**
 * L'assemblage — l'unique chemin, du test comme de l'écran.
 *
 * ⚠️ Il REFUSE une doctrine vide. C'est l'équivalent, côté plateforme, du crible
 * « cite ou refuse » : le script de dérivation s'arrête quand une source a
 * bougé ; ici, on s'arrête quand elle n'a jamais été lue. Un contrôle d'import
 * qui tournerait sur une doctrine vide accepterait tout.
 */
export function assemblerDoctrine(rows: LignesDoctrine): Doctrine {
  if (!rows.exercices_crans?.length || !rows.exercices_types?.length
      || !rows.exercices_routes?.length) {
    throw new DoctrineAbsente(
      'La doctrine n\'est pas en base : jouer `scripts/derive-doctrine.py --sql`. '
      + 'Un contrôle qui tournerait sur une doctrine vide accepterait tout.')
  }

  const crans: Record<number, CranDoctrine> = {}
  for (const c of rows.exercices_crans) {
    crans[c.cran] = {
      n: c.cran, code: c.code, geste: c.geste as CranDoctrine['geste'],
      appui: c.appui, fait: c.fait, palierVise: c.palier_vise,
      materiauCible: c.materiau_cible as CranDoctrine['materiauCible'],
      defaut: c.defaut as CranDoctrine['defaut'],
      distracteurs: c.distracteurs as CranDoctrine['distracteurs'],
      reponseAttendue: c.reponse_attendue as CranDoctrine['reponseAttendue'],
      guide: c.guide as CranDoctrine['guide'],
      jugement: c.jugement as CranDoctrine['jugement'],
      couverture: c.couverture_observables as CranDoctrine['couverture'],
      regimeV1vf: c.regime_v1vf,
      isole: c.couverture_observables === 'isole',
    }
  }

  const modesAdmis: Record<string, string[]> = {}
  for (const { competence, mode } of rows.competences_modes_admis) {
    ;(modesAdmis[competence] ??= []).push(mode)
  }

  const durees: Record<string, { min: number; max: number; valeur: number }> = {}
  for (const d of rows.exercices_durees) {
    durees[`${d.geste}|${d.grain}`] = { min: d.borne_min, max: d.borne_max, valeur: d.duree_min }
  }

  const objets: Record<string, ObjetDoctrine> = {}
  for (const t of rows.exercices_types) {
    // Les deux types diagnostiques (`nature` `complet`) n'ont ni objet ni cran :
    // ils n'entrent ni dans le format d'import (`08-` §5) ni dans le pipeline
    // du `02-` §6 B — ils sont le « fait quand » de C4-L4 (piège 2).
    if (t.nature === 'complet') continue
    objets[t.code] = {
      code: t.code,
      libelle: t.libelle ?? t.code,
      nature: t.nature,
      grain: t.grain ?? '',
      supportSource: t.supports_source ?? [],
      genres: t.genres_admis ?? [],
      competences: t.competences ?? [],
      modes: t.modes_objet ?? [],
      crans: new Set((t.crans_admis ?? []).map(entier)),
      exclusionsParcours: t.exclusions_parcours ?? [],
      sourceParMode: {},
      parCran: {},
    }
  }
  // Les `modes[]` de l'objet — l'union de ce que ses compétences déclarent —
  // sont redonnés par `exercices_types_modes_source`, une ligne par mode ouvert.
  for (const s of rows.exercices_types_modes_source) {
    const o = objets[s.objet_code]
    if (!o) continue
    o.sourceParMode[s.mode] = { provenances: s.provenances_admises ?? [], supports: s.supports_admis ?? [] }
    if (!o.modes.includes(s.mode)) o.modes.push(s.mode)
  }
  for (const tc of rows.exercices_types_crans) {
    const o = objets[tc.objet_code]
    if (!o) continue
    o.parCran[entier(tc.cran)] = {
      couverture: tc.couverture_observables,
      provenancesCible: tc.provenances_admises_cible ?? [],
      dureeMin: tc.duree_exercice_min,
    }
  }

  // Les routes : une ligne par cran en base, regroupées par case comme en
  // Python — le domicile d'une route est (fichier, section), pas le code.
  const routes: Record<string, RouteDoctrine[]> = {}
  const parCase = new Map<string, RouteDoctrine>()
  for (const r of rows.exercices_routes) {
    const cle = `${r.objet_code}|${r.mode}`
    const cleCase = `${cle}|${r.competence}|${r.source_section}`
    let route = parCase.get(cleCase)
    if (!route) {
      route = {
        objet: r.objet_code, mode: r.mode, competence: r.competence,
        code: r.observable_code, nom: r.observable_nom,
        fichier: r.source_fichier, section: r.source_section, crans: [],
      }
      parCase.set(cleCase, route)
      ;(routes[cle] ??= []).push(route)
    }
    route.crans.push(r.cran)
  }
  for (const rs of Object.values(routes)) for (const r of rs) r.crans.sort((a, b) => a - b)

  const consignesIsolees: Record<string, Record<number, { appui: string; consigne: string }>> = {}
  const observables: Doctrine['observables'] = {}
  for (const c of rows.exercices_consignes_isolees) {
    const cle = `${c.competence}|${c.source_section}`
    ;(consignesIsolees[cle] ??= {})[c.cran] = { appui: c.appui, consigne: c.consigne }
    observables[cle] ??= {
      competence: c.competence, section: c.source_section, nom: c.observable_nom,
      codeComposition: c.observable_code_composition,
      codeReception: c.observable_code_reception,
      defautInjecte: c.defaut_injecte,
    }
  }

  const consignesProduction: Record<string, string> = {}
  for (const p of rows.exercices_consignes_production) {
    consignesProduction[`${p.mode}|${p.cran}`] = p.patron
  }

  const guidesProduction: Doctrine['guidesProduction'] = {}
  for (const g of rows.exercices_guides_production) {
    const cle = g.genre ? `${g.objet_code}|${g.genre}` : g.objet_code
    guidesProduction[cle] = { figure: g.figure, cran2: g.guide_cran2, cran6: g.guide_cran6 }
  }

  const formesDemonstration: Record<string, string> = {}
  for (const f of rows.demonstrations_formes) formesDemonstration[f.forme] = f.grain

  return {
    objets, crans, modesAdmis, durees, routes, consignesIsolees, observables,
    consignesProduction, guidesProduction, formesDemonstration,
  }
}

// ── Les lectures que le reste du lot demande ────────────────────────────────

/** L'intersection du `competences[]` de l'objet et des modes admis (`04-` §0). */
export function competencesMesurables(d: Doctrine, objet: string, mode: string): string[] {
  const o = d.objets[objet]
  if (!o) return []
  return o.competences.filter((c) => (d.modesAdmis[c] ?? []).includes(mode))
}

/** La durée, dérivée du GESTE du cran et du GRAIN de l'objet (`02-` §2.4).
 *  « Elle ne se saisit jamais à la main », et c'est la seule valeur que le
 *  budget décompte. */
export function dureeExercice(d: Doctrine, objet: string, cran: number): number | null {
  const o = d.objets[objet]
  const c = d.crans[cran]
  if (!o || !c) return null
  return d.durees[`${c.geste}|${o.grain}`]?.valeur ?? null
}

/** Les routes servables pour ce couple à ce cran. */
export function observablesIsoles(d: Doctrine, objet: string, mode: string, cran: number): RouteDoctrine[] {
  return (d.routes[`${objet}|${mode}`] ?? []).filter((r) => r.crans.includes(cran))
}

/** La banque de consignes du couple objet × mode × cran (`02-` §6 B).
 *  Aux six crans qui isolent, elle vient des routes ; aux trois crans de
 *  production, du patron du `04-` §14.1, « l'objet du `02-` §1 » en case. */
export function banqueDeConsignes(
  d: Doctrine, objet: string, mode: string, cran: number, genre?: string | null,
): Array<{ consigne: string; appui: string; observable?: RouteDoctrine }> {
  const c = d.crans[cran]
  const o = d.objets[objet]
  if (!c || !o) return []
  if (c.isole) {
    const out: Array<{ consigne: string; appui: string; observable: RouteDoctrine }> = []
    for (const r of observablesIsoles(d, objet, mode, cran)) {
      const bloc = d.consignesIsolees[`${r.competence}|${r.section}`]?.[cran]
      if (bloc) out.push({ consigne: bloc.consigne, appui: bloc.appui, observable: r })
    }
    return out
  }
  const patron = d.consignesProduction[`${mode}|${cran}`]
  if (!patron) return []
  const guide = (genre ? d.guidesProduction[`${objet}|${genre}`] : undefined)
    ?? d.guidesProduction[objet]
  const servi = cran === 2 ? (d.guidesProduction[objet]?.cran2 ?? '') : ''
  const nomme = cran === 6 ? (guide?.cran6 ?? d.guidesProduction[objet]?.cran6 ?? '') : ''
  return [{
    appui: c.appui,
    consigne: patron
      .replace('<objet>', d.objets[objet].libelle.replace(/^(L'|Le |La |Les )/, (m) => m.toLowerCase()))
      .replace('<ce qui est servi>', servi)
      .replace('<les appuis nommés>', nomme),
  }]
}

// ── Le chargement en base ───────────────────────────────────────────────────

/**
 * Le client Supabase, réduit à ce qu'on lui demande ici — et on lui demande
 * deux choses : une table LUE, ordonnée et paginée, et le DÉCOMPTE qu'elle
 * annonce.
 *
 * ⚠️ Élargi au strict minimum de ce que `lireTable` appelle : `.order()` et
 * `.range()` sont le prix de la pagination, `{ count, head }` celui du
 * garde-fou. Le remplacer par `SupabaseClient` ferait perdre à ce module ce
 * qui le rend lisible — il déclare exactement ce qu'il exige de son client, et
 * les quatre appelants lui passent déjà `admin as never`.
 */
type ReponseLignes = Promise<{ data: unknown[] | null; error: unknown }>
type ReponseCompte = Promise<{ count: number | null; error: unknown }>
type RequeteLignes = {
  order: (colonne: string, options?: { ascending?: boolean }) => RequeteLignes
  range: (debut: number, fin: number) => ReponseLignes
}
type ClientLecture = {
  from: (table: string) => {
    select: {
      (cols: string): RequeteLignes
      (cols: string, options: { count: 'exact'; head: true }): ReponseCompte
    }
  }
}

/** Le plafond de lignes de PostgREST — `db-max-rows`, mille par défaut. Une
 *  réponse qui l'atteint NE SIGNALE RIEN : `error` reste nul, et la table
 *  revient tronquée comme si elle était complète. */
const PAGE = 1000

/**
 * C4 · L8-bis — UNE TABLE, LUE EN ENTIER. Le seul chemin, pour les douze.
 *
 * Trois gestes, et aucun n'est décoratif :
 *
 * · ON PAGINE. Le patron est déjà au dépôt — `depenseParPages` de
 *   `utils/chaine/couts-serveur.ts` : « on pagine, et on ne s'arrête que quand
 *   une page revient courte ». **Les douze tables, pas la seule qui déborde
 *   aujourd'hui** : une seule dépasse mille lignes (`exercices_routes`, 3264),
 *   la suivante en porte 336, et sur les onze autres la première page revient
 *   courte — la boucle s'arrête au premier tour, le coût est nul. Ne viser que
 *   la table qui déborde ferait revenir le même défaut, en silence, le jour où
 *   une source grossit.
 *
 * · ON ORDONNE sur une clé stable. Sans `order`, l'ordre de retour n'est
 *   garanti par rien d'une requête à l'autre : deux pages peuvent se recouvrir
 *   ET une ligne se perdre. C'est le défaut le plus vicieux du geste, parce
 *   qu'il rend une doctrine du bon NOMBRE et du mauvais CONTENU.
 *
 * · ON CONFRONTE au décompte que la base annonce, et on S'ARRÊTE quand les deux
 *   diffèrent. Le décompte se demande avec LE MÊME `select` que la lecture —
 *   jointures embarquées comprises —, pour que les deux nombres portent sur le
 *   même ensemble par construction. ⚠️ **Le décompte vient de la BASE, jamais
 *   des comptes de la fixture** : `exercices_types` porte quinze lignes en base
 *   — les treize objets dérivés plus les deux types diagnostiques du seed de
 *   C4-L1 — quand la fixture n'en porte que treize.
 *
 * Le garde-fou vit ICI et pas dans `assemblerDoctrine` : l'assemblage sert aussi
 * la fixture, qui n'a pas de base à interroger, et il n'y a pas d'autre endroit
 * où le décompte annoncé existe.
 */
async function lireTable(
  admin: ClientLecture, nom: string, cols: string, cle: string[],
): Promise<never[]> {
  // Le décompte part AVEC la première page, pas après la dernière : il ne dépend
  // d'aucune d'elles, et l'attendre en série ajouterait un aller-retour par
  // table à une page que douze lectures parallèles font déjà attendre.
  //
  // ⚠️ LE `Promise.resolve` N'EST PAS DÉCORATIF. Un constructeur de requête
  // Supabase est PARESSEUX : il ne part qu'au premier `then`. Le garder tel quel
  // dans une variable ne lancerait rien — la requête ne serait émise qu'au
  // `await` du bas, c'est-à-dire en série, et le gain serait nul sans que rien
  // ne le dise.
  const decompte = Promise.resolve(
    admin.from(nom).select(cols, { count: 'exact', head: true }))

  const lignes: unknown[] = []
  for (let debut = 0; ; debut += PAGE) {
    let q = admin.from(nom).select(cols)
    for (const colonne of cle) q = q.order(colonne, { ascending: true })
    const { data, error } = await q.range(debut, debut + PAGE - 1)
    if (error) throw new DoctrineAbsente(`lecture de ${nom} : ${JSON.stringify(error)}`)
    const page = data ?? []
    lignes.push(...page)
    if (page.length < PAGE) break
  }

  const { count, error } = await decompte
  if (error) throw new DoctrineAbsente(`décompte de ${nom} : ${JSON.stringify(error)}`)
  if (count === null || count !== lignes.length) {
    throw new DoctrineTronquee(
      `Doctrine TRONQUÉE — la table ${nom} : ${lignes.length} ligne(s) lue(s), `
      + `${count === null ? 'décompte indisponible' : `${count} en base`}. `
      + 'On s\'arrête : une doctrine incomplète ne se dénonce pas d\'elle-même, '
      + 'elle refuse ce qui est licite avec le motif de la source — un observable '
      + 'pourtant routé s\'y ferait refuser « non routé ». '
      + 'Rien n\'est à corriger en base : c\'est la LECTURE qui n\'a pas tout rendu. '
      + 'Si le nombre en base est lui-même trop bas, c\'est une dérivation qui '
      + 'manque, et elle se rejoue par `python3 scripts/derive-doctrine.py --sql`.')
  }
  return lignes as never[]
}

/**
 * Les lignes, lues en base. Les tables de doctrine ne portent AUCUNE ligne
 * d'élève : la lecture passe par le client admin, côté serveur, comme toutes
 * les écritures (`07-` §1).
 *
 * ⚠️ LES DOUZE APPELS RESTENT EN PARALLÈLE. Chacun se pagine pour son compte ;
 * les mettre en série « pour simplifier » ferait attendre la page de conception
 * douze fois au lieu d'une.
 *
 * La clé de tri de chaque table est SA CLÉ PRIMAIRE — ou, pour
 * `exercices_guides_production`, qui n'en porte pas, son unique
 * `(type_id, genre)`. C'est ce qui rend l'ordre total, donc la pagination sûre.
 */
export async function chargerLignesDepuisBase(admin: ClientLecture): Promise<LignesDoctrine> {
  const table = (nom: string, cols: string, cle: string[]) => lireTable(admin, nom, cols, cle)
  const [types, modes, source, parCran, cransT, durees, admis, routes,
    consignes, patrons, guides, formes] = await Promise.all([
    table('exercices_types', 'code,nature,grain,libelle,supports_source,genres_admis,competences,crans_admis,exclusions_parcours', ['id']),
    table('exercices_types_modes', 'competence,modes,exercices_types!inner(code)', ['id']),
    table('exercices_types_modes_source', 'mode,provenances_admises,supports_admis,exercices_types!inner(code)', ['type_id', 'mode']),
    table('exercices_types_crans', 'cran,couverture_observables,provenances_admises_cible,duree_exercice_min,exercices_types!inner(code)', ['id']),
    table('exercices_crans', '*', ['cran']),
    table('exercices_durees', '*', ['geste', 'grain']),
    table('competences_modes_admis', 'competence,mode', ['competence', 'mode']),
    table('exercices_routes', 'objet_code,mode,cran,competence,observable_code,observable_nom,source_fichier,source_section', ['id']),
    table('exercices_consignes_isolees', '*', ['competence', 'source_section', 'cran']),
    table('exercices_consignes_production', 'mode,cran,patron', ['mode', 'cran']),
    table('exercices_guides_production', 'objet_code,genre,figure,guide_cran2,guide_cran6', ['type_id', 'genre']),
    table('demonstrations_formes', 'forme,grain', ['forme']),
  ])
  const code = (r: Record<string, unknown>) =>
    (r.exercices_types as { code: string } | null)?.code ?? ''
  return {
    exercices_types: types,
    exercices_types_modes: (modes as Array<Record<string, unknown>>).map((r) => ({
      objet_code: code(r), competence: r.competence as string, modes: r.modes as string[],
    })),
    exercices_types_modes_source: (source as Array<Record<string, unknown>>).map((r) => ({
      objet_code: code(r), mode: r.mode as string,
      provenances_admises: r.provenances_admises as string[],
      supports_admis: r.supports_admis as string[],
    })),
    exercices_types_crans: (parCran as Array<Record<string, unknown>>).map((r) => ({
      objet_code: code(r), cran: r.cran as string,
      couverture_observables: r.couverture_observables,
      provenances_admises_cible: r.provenances_admises_cible as string[],
      duree_exercice_min: r.duree_exercice_min as number,
    })),
    exercices_crans: cransT,
    exercices_durees: durees,
    competences_modes_admis: admis,
    exercices_routes: routes,
    exercices_consignes_isolees: consignes,
    exercices_consignes_production: patrons,
    exercices_guides_production: guides,
    demonstrations_formes: formes,
  }
}

export async function chargerDoctrineDepuisBase(admin: ClientLecture): Promise<Doctrine> {
  return assemblerDoctrine(await chargerLignesDepuisBase(admin))
}
