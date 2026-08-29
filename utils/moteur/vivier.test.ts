// ============================================================================
// C4 · L12 — LE VIVIER, ÉPROUVÉ. Les trois filtres, et ce qu'ils laissent passer.
// ----------------------------------------------------------------------------
// Ce que ces tests tiennent, et que rien d'autre ne tiendrait :
//   · la règle d'exclusion « TOUS ses parcours », jamais « un seul » ;
//   · les deux mécanismes de parcours qui NE SE MÉLANGENT PAS (`02-` §4) ;
//   · le piège de la VACUITÉ, qui LÈVE plutôt que d'exclure de tout ;
//   · `cours_etat = aucun` qui veut dire JAMAIS, et `cours_id` NULL qui ne
//     rend rien servable ;
//   · la position de lecture INCONNUE, qui n'est pas la position ZÉRO ;
//   · et le sens de « séance terminée » que ce lot a fixé.
// ============================================================================

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  candidatsPour, constituerLeVivier, couvertureDeLInstance, filtreDeParcours,
  filtreDuCoursVu, filtreDuNonSpoiler, ParcoursVide, positionDeLecture,
  substratsDeLaSemaine, type ContexteDuVivier, type InstanceDuVivier, type MateriauRattache,
} from './vivier'
import type { ExercicePose } from '../routeur/semaine'

const materiau = (p: Partial<MateriauRattache> = {}): MateriauRattache => ({
  sorte: 'sujet', id: 'aaaaaaaa-0000-0000-0000-000000000000', role: 'source',
  coursEtat: 'generique', coursApparies: [], coursDeclares: 0,
  planLivreReferenceId: null, planSemaine: null, statut: 'valide', bloque: false, ...p,
})

const instance = (p: Partial<InstanceDuVivier> = {}): InstanceDuVivier => ({
  exerciceId: 'ex-1', objet: 'argument', grain: 'meso', geste: 'produire',
  cranNumero: 6, cranCode: 'production_etayee', dureeMin: 20, lieu: 'maison',
  classeId: null,
  statut: 'concu', bloque: false, genre: null, exclusionsParcours: [],
  modesParCompetence: { argumentation: ['composer'], expression: ['composer'] },
  couverture: { argumentation: 'exerce', expression: 'exerce' },
  materiaux: [materiau()], ...p,
})

const contexte = (p: Partial<ContexteDuVivier> = {}): ContexteDuVivier => ({
  parcours: ['tc'], coursVus: new Set(), positionsDeLecture: new Map(),
  instancesDejaDeposees: new Set(), classesDeLEleve: new Set(['classe-A']), ...p,
})

// ── FILTRE 1 — le parcours ──────────────────────────────────────────────────

describe('`02-` §4 — le filtre de parcours, et ses deux mécanismes', () => {
  it('l\'exclusion écarte l\'élève dont TOUS les parcours figurent dans la liste', () => {
    const pb = instance({ exclusionsParcours: ['hlp'] })
    assert.equal(filtreDeParcours(pb, ['hlp']).retenue, false)
  })

  it('⭐ mais PAS le bi-classe, « qui en porte un » — la problématisation lui arrive', () => {
    const pb = instance({ exclusionsParcours: ['hlp'] })
    assert.equal(filtreDeParcours(pb, ['tc', 'hlp']).retenue, true)
    assert.equal(filtreDeParcours(pb, ['tc']).retenue, true)
  })

  it('le `genre` de l\'instance porte son parcours DANS SON NOM', () => {
    assert.equal(filtreDeParcours(instance({ genre: 'essai_hlp' }), ['hlp']).retenue, true)
    assert.equal(filtreDeParcours(instance({ genre: 'essai_hlp' }), ['tc']).retenue, false)
    assert.equal(filtreDeParcours(instance({ genre: 'dissertation_tc' }), ['tc']).retenue, true)
  })

  it('`generique` va à tout le monde, et un bi-classe reçoit LES DEUX CÔTÉS', () => {
    assert.equal(filtreDeParcours(instance({ genre: 'generique' }), ['tc']).retenue, true)
    assert.equal(filtreDeParcours(instance({ genre: 'generique' }), ['hlp']).retenue, true)
    assert.equal(filtreDeParcours(instance({ genre: 'essai_hlp' }), ['tc', 'hlp']).retenue, true)
    assert.equal(filtreDeParcours(instance({ genre: 'dissertation_tc' }), ['tc', 'hlp']).retenue,
      true)
  })

  it('⛔ LES DEUX MÉCANISMES NE SE MÉLANGENT PAS : un genre déclaré ignore l\'exclusion', () => {
    // Le cas ne se présente pas en base — la problématisation n'a pas de genre —
    // mais la règle est écrite, et c'est elle qu'on tient.
    const melange = instance({ genre: 'essai_hlp', exclusionsParcours: ['hlp'] })
    assert.equal(filtreDeParcours(melange, ['hlp']).retenue, true)
  })

  it('⛔⛔ LE PIÈGE DE LA VACUITÉ — un ensemble de parcours VIDE LÈVE, il n\'exclut pas', () => {
    assert.throws(() => filtreDeParcours(instance({ exclusionsParcours: ['hlp'] }), []),
      ParcoursVide)
    // Et même sans exclusion : la règle ne se tranche pas sur du vide.
    assert.throws(() => filtreDeParcours(instance(), []), ParcoursVide)
  })
})

// ── FILTRE 2 — le cours vu ──────────────────────────────────────────────────

describe('`01-` §4 — le cours vu, et le sens fort de l\'absence', () => {
  it('`generique` est servable en tout temps, même sans aucun cours vu', () => {
    assert.equal(filtreDuCoursVu([materiau({ coursEtat: 'generique' })], new Set()).retenue, true)
  })

  it('⛔ `aucun` veut dire JAMAIS SERVABLE — pas « pas encore rempli »', () => {
    const r = filtreDuCoursVu([materiau({ coursEtat: 'aucun' })], new Set(['c1']))
    assert.equal(r.retenue, false)
    assert.equal(r.motif, 'cours_jamais_servable')
  })

  it('⛔ AUCUN MATÉRIAU = aucun rattachement = pas servable, et le motif se nomme', () => {
    const r = filtreDuCoursVu([], new Set(['c1']))
    assert.equal(r.retenue, false)
    assert.equal(r.motif, 'aucun_materiau')
  })

  it('⛔ `cours_id` NULL — « déclaré mais pas encore apparié » ne rend rien servable', () => {
    const r = filtreDuCoursVu(
      [materiau({ coursEtat: 'liste', coursApparies: [], coursDeclares: 2 })], new Set(['c1']))
    assert.equal(r.retenue, false)
    assert.equal(r.motif, 'cours_non_apparie')
  })

  it('`liste` : servable dès qu\'AU MOINS UN cours apparié a été vu', () => {
    const m = materiau({ coursEtat: 'liste', coursApparies: ['c1', 'c2'], coursDeclares: 2 })
    assert.equal(filtreDuCoursVu([m], new Set(['c2'])).retenue, true)
    assert.equal(filtreDuCoursVu([m], new Set(['c9'])).motif, 'cours_pas_encore_vu')
  })

  it('⚠️ mais TOUS les matériaux doivent l\'être — une source à venir spoilerait', () => {
    const vue = materiau({ id: 'm1', coursEtat: 'liste', coursApparies: ['c1'], coursDeclares: 1 })
    const pasVue = materiau({ id: 'm2', role: 'cible', coursEtat: 'liste',
      coursApparies: ['c9'], coursDeclares: 1 })
    assert.equal(filtreDuCoursVu([vue, pasVue], new Set(['c1'])).retenue, false)
  })

  // ── ⭐⭐ C4-L16 — LE QUATRIÈME ÉTAT, ET UN MOTIF QUI CESSE DE MENTIR ───────
  // « Le lot ne porte PAS le filtre » — la couche 4 en `notions` est le premier
  // geste de C4-L12. **Mais un motif faux n'est pas "pas de filtre" : c'est un
  // filtre qui ment.**
  it('⛔ C4-L16 — `notions` n\'est PAS lu par la couche 4, et le motif le DIT', () => {
    const r = filtreDuCoursVu(
      [materiau({ coursEtat: 'notions', coursApparies: [], coursDeclares: 0 })],
      new Set(['c1']))
    assert.equal(r.retenue, false, 'le sujet reste écarté, exactement comme avant')
    assert.equal(r.motif, 'cours_par_notions_non_lu')
    assert.match(r.detail, /la couche 4 ne le lit pas encore/)
  })

  it('⛔ C4-L16 — et SURTOUT PAS `cours_non_apparie`, qui enverrait réparer un écran vide', () => {
    // C'est le défaut exact que cette branche répare : avant elle, un `notions`
    // tombait dans le `default` de la `liste` et ressortait en « N cours
    // déclaré(s), AUCUN apparié » — alors qu'il n'y a AUCUN cours à apparier.
    const r = filtreDuCoursVu(
      [materiau({ coursEtat: 'notions', coursApparies: [], coursDeclares: 0 })], new Set())
    assert.notEqual(r.motif, 'cours_non_apparie')
    assert.doesNotMatch(r.detail, /AUCUN apparié/)
  })

  it('⚠️ C4-L16 — un `notions` écarte l\'instance ENTIÈRE, même si l\'autre matériau passe', () => {
    const ok = materiau({ id: 'm1', coursEtat: 'generique' })
    const parNotions = materiau({ id: 'm2', role: 'cible', coursEtat: 'notions' })
    const r = filtreDuCoursVu([ok, parNotions], new Set(['c1']))
    assert.equal(r.retenue, false)
    assert.equal(r.motif, 'cours_par_notions_non_lu')
  })
})

// ── FILTRE 3 — le non-spoiler ───────────────────────────────────────────────

describe('`01-` §4 — le non-spoiler, et la position de lecture de L\'ÉLÈVE', () => {
  it('⭐ « terminée » = `DONE`, et à défaut `VF_SUBMITTED` — la lecture de ce lot', () => {
    const t = [
      { livreId: 'L', semaineIndex: 1, statut: 'DONE' },
      { livreId: 'L', semaineIndex: 2, statut: 'VF_SUBMITTED' },
      { livreId: 'L', semaineIndex: 3, statut: 'FEEDBACK1_READY' },
      { livreId: 'L', semaineIndex: 9, statut: 'DRAFT' },
    ]
    assert.equal(positionDeLecture(t, 'L'), 2)
  })

  it('un livre sans aucun travail terminé rend `null` — INCONNUE, jamais ZÉRO', () => {
    assert.equal(positionDeLecture([{ livreId: 'L', semaineIndex: 4, statut: 'DRAFT' }], 'L'), null)
    assert.equal(positionDeLecture([], 'L'), null)
  })

  it('la position se lit PAR LIVRE — celle d\'un autre livre ne compte pas', () => {
    const t = [{ livreId: 'AUTRE', semaineIndex: 12, statut: 'DONE' }]
    assert.equal(positionDeLecture(t, 'L'), null)
  })

  it('hors livre : rien à comparer, et la borne le DIT', () => {
    const r = filtreDuNonSpoiler([materiau()], new Map())
    assert.equal(r.retenue, true)
    assert.equal(r.borne.regime, 'hors_livre')
    assert.equal(r.borne.seanceMaxExigee, null)
  })

  it('⛔ position INCONNUE → non servi ; « à défaut, un texte court hors livre »', () => {
    const m = materiau({ sorte: 'texte', planLivreReferenceId: 'LR', planSemaine: 3 })
    const r = filtreDuNonSpoiler([m], new Map())
    assert.equal(r.retenue, false)
    assert.equal(r.borne.regime, 'position_inconnue')
  })

  it('⛔ au-delà de la position → non servi ; à la position exacte → servi', () => {
    const m = materiau({ sorte: 'texte', planLivreReferenceId: 'LR', planSemaine: 3 })
    assert.equal(filtreDuNonSpoiler([m], new Map([['LR', 2]])).retenue, false)
    assert.equal(filtreDuNonSpoiler([m], new Map([['LR', 3]])).retenue, true)
    assert.equal(filtreDuNonSpoiler([m], new Map([['LR', 7]])).borne.regime, 'sous_la_position')
  })

  it('la borne journalise le couple { livre, séance } et la position — les trois', () => {
    const m = materiau({ id: 'M', sorte: 'texte', planLivreReferenceId: 'LR', planSemaine: 3 })
    const r = filtreDuNonSpoiler([m], new Map([['LR', 5]]))
    assert.deepEqual(r.borne.bornes, [
      { materiauId: 'M', livreReferenceId: 'LR', planSeance: 3, positionEleve: 5 },
    ])
  })
})

// ── LA COUVERTURE ───────────────────────────────────────────────────────────

describe('`02-` §2.3.2 — la couverture, dérivée du geste', () => {
  it('`produire` : ciblable ce que le cran met en `exerce`, le reste `observable_seul`', () => {
    const c = couvertureDeLInstance(['argumentation', 'synthese'], 'produire',
      ['argumentation', 'expression'], null)
    assert.deepEqual(c, { argumentation: 'exerce', synthese: 'observable_seul' })
  })

  it('⛔ `transformer`/`diagnostiquer` : UNE SEULE cible, celle que l\'instance isole', () => {
    const c = couvertureDeLInstance(['argumentation', 'structure'], 'diagnostiquer', [],
      'structure')
    assert.deepEqual(c, { argumentation: 'observable_seul', structure: 'isole' })
  })

  it('un cran qui isole SANS observable isolé ne rend aucune cible', () => {
    const c = couvertureDeLInstance(['argumentation'], 'transformer', [], null)
    assert.deepEqual(c, { argumentation: 'observable_seul' })
  })
})

// ── LE VIVIER COMPOSÉ ───────────────────────────────────────────────────────

describe('`01-` §4, couche 4 — le vivier composé, et l\'écart NOMMÉ', () => {
  it('une instance ordinaire entre, avec sa borne et ses ciblables', () => {
    const v = constituerLeVivier([instance()], contexte())
    assert.equal(v.retenus.length, 1)
    assert.deepEqual(v.retenus[0].ciblables.sort(), ['argumentation', 'expression'])
    assert.equal(v.retenus[0].plafondCibles, 2) // méso
    assert.equal(v.ecartes.length, 0)
  })

  it('⛔ la voie du professeur reste dehors : `lieu = classe` est HORS ROUTAGE', () => {
    const v = constituerLeVivier([instance({ lieu: 'classe' })], contexte())
    assert.equal(v.retenus.length, 0)
    assert.equal(v.ecartes[0].motif, 'lieu_classe')
  })

  // ── FILTRE DE CLASSE — `C6L3-30`, arbitrage de Louis du 28/08 ────────────

  it('⛔ une instance donnée à une AUTRE classe reste dehors, et le motif la nomme', () => {
    const v = constituerLeVivier([instance({ classeId: 'classe-B' })], contexte())
    assert.equal(v.retenus.length, 0)
    assert.equal(v.ecartes[0].motif, 'classe_autre')
    // Le motif est SERVI — le bilan d'un dépôt l'affiche : il doit se lire.
    assert.match(v.ecartes[0].detail, /n'y est pas inscrit/)
  })

  it('⭐ mais une instance de SA classe entre', () => {
    const v = constituerLeVivier([instance({ classeId: 'classe-A' })], contexte())
    assert.equal(v.retenus.length, 1)
  })

  it('⭐⭐ et le NULL entre TOUJOURS — « une instance sans classe n\'est pas l\'autre classe »', () => {
    const v = constituerLeVivier([instance({ classeId: null })], contexte())
    assert.equal(v.retenus.length, 1)
    assert.equal(v.ecartes.length, 0)
  })

  it('⭐ le BI-CLASSE reçoit ce qui est donné à l\'une OU à l\'autre', () => {
    const ctx = contexte({ classesDeLEleve: new Set(['classe-A', 'classe-B']) })
    assert.equal(constituerLeVivier([instance({ classeId: 'classe-B' })], ctx).retenus.length, 1)
    assert.equal(constituerLeVivier([instance({ classeId: 'classe-C' })], ctx).retenus.length, 0)
  })

  it('⚠️ le filtre de classe ne mord PAS avant `lieu_classe` — une passation en classe\n'
    + '     estampillée d\'une autre classe sort en `lieu_classe`, qui est son vrai motif', () => {
    const v = constituerLeVivier([instance({ lieu: 'classe', classeId: 'classe-B' })], contexte())
    assert.equal(v.ecartes[0].motif, 'lieu_classe')
  })

  it('⛔ n\'entre que ce qui est `concu` ou `assigne`, et NON BLOQUÉ', () => {
    const v = constituerLeVivier([
      instance({ exerciceId: 'a', statut: 'a_concevoir' }),
      instance({ exerciceId: 'b', statut: 'clos' }),
      instance({ exerciceId: 'c', statut: 'assigne', bloque: true }),
      instance({ exerciceId: 'd', statut: 'assigne' }),
    ], contexte())
    assert.deepEqual(v.retenus.map((r) => r.instance.exerciceId), ['d'])
    assert.deepEqual(v.ecartes.map((e) => e.motif), ['statut', 'statut', 'bloquee'])
  })

  it('⛔ RESSERVIR LA MÊME INSTANCE AU MÊME ÉLÈVE — écartée, et le motif se nomme', () => {
    const v = constituerLeVivier([instance({ exerciceId: 'x' })],
      contexte({ instancesDejaDeposees: new Set(['x']) }))
    assert.equal(v.retenus.length, 0)
    assert.equal(v.ecartes[0].motif, 'deja_deposee')
  })

  it('⛔ une durée absente écarte : « le budget ne décompte qu\'elle »', () => {
    const v = constituerLeVivier([instance({ dureeMin: null })], contexte())
    assert.equal(v.ecartes[0].motif, 'sans_duree')
  })

  it('un matériau non validé n\'entre jamais dans une phase de jugement', () => {
    const v = constituerLeVivier(
      [instance({ materiaux: [materiau({ statut: 'a_valider' })] })], contexte())
    assert.equal(v.ecartes[0].motif, 'materiau_non_valide')
  })

  it('une instance dont toutes les compétences sont `observable_seul` n\'est pas ciblable', () => {
    const v = constituerLeVivier([instance({
      couverture: { argumentation: 'observable_seul', expression: 'observable_seul' },
    })], contexte())
    assert.equal(v.ecartes[0].motif, 'aucune_competence_ciblable')
  })
})

// ── `candidatsPour` ─────────────────────────────────────────────────────────

describe('`01-` §5 — `candidatsPour`, le rappel que la phase B interroge', () => {
  const vivier = constituerLeVivier([
    instance({ exerciceId: 'a' }),
    instance({ exerciceId: 'b' }),
  ], contexte()).retenus

  it('rend les instances qui portent la compétence, avec sa durée et son CODE de cran', () => {
    const c = candidatsPour(vivier, 'argumentation', [])
    assert.deepEqual(c.map((x) => x.exerciceId), ['a', 'b'])
    assert.equal(c[0].dureeMin, 20)
    assert.equal(c[0].cran, 'production_etayee') // le CODE, jamais le numéro
    assert.equal(c[0].mode, 'composer')
  })

  it('⭐ le vivier SE CONSOMME : une instance déjà posée ne revient pas', () => {
    const pose = { candidat: candidatsPour(vivier, 'argumentation', [])[0], regle: 'R2',
      departageParPB3: false, tour: 0 } as ExercicePose
    const c = candidatsPour(vivier, 'argumentation', [pose])
    assert.deepEqual(c.map((x) => x.exerciceId), ['b'])
  })

  it('PB4 — les secondaires tiennent dans le plafond du grain, primaire comprise', () => {
    const c = candidatsPour(vivier, 'argumentation', [])
    assert.deepEqual(c[0].ciblesSecondaires, ['expression']) // méso : 2 cibles, dont la primaire
  })

  it('R1 à C — l\'Expression prend EN PLUS une secondaire sur méso/macro `produire`', () => {
    const micro = constituerLeVivier([instance({ exerciceId: 'm', grain: 'micro' })],
      contexte()).retenus
    // Au micro, le plafond vaut 1 : aucune secondaire, R1 ou pas.
    assert.deepEqual(candidatsPour(micro, 'argumentation', [], true)[0].ciblesSecondaires, [])
    // Au méso, elle y est.
    assert.deepEqual(candidatsPour(vivier, 'argumentation', [], true)[0].ciblesSecondaires,
      ['expression'])
  })

  it('une compétence que l\'instance n\'a pas en cible ne rend aucun candidat', () => {
    assert.deepEqual(candidatsPour(vivier, 'synthese', []), [])
  })
})

describe('`01-` §5, phase C — les substrats de la semaine', () => {
  it('un substrat liste TOUT ce que l\'objet mesure, `observable_seul` compris', () => {
    const vivier = constituerLeVivier([instance({
      modesParCompetence: { argumentation: ['composer'], synthese: ['restituer'] },
      couverture: { argumentation: 'exerce', synthese: 'observable_seul' },
    })], contexte()).retenus
    const pose = { candidat: candidatsPour(vivier, 'argumentation', [])[0], regle: 'R2',
      departageParPB3: false, tour: 0 } as ExercicePose
    const s = substratsDeLaSemaine([pose], vivier)
    assert.deepEqual(s[0].competences.sort(), ['argumentation', 'synthese'])
    assert.deepEqual(s[0].cibles, ['argumentation'])
    assert.equal(s[0].sondesDeja, 0)
  })
})
