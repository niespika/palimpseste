// ============================================================================
// C4 · L12 — LE SECOND VERROU, ÉPROUVÉ. Ce que la colonne porte, et pourquoi.
// ============================================================================

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  CLES_RETIREES_DU_NIVEAU, LigneDeNiveauInvalide, lettreAEcrire, ligneDEscalade,
  grouperParForme, ligneDeMontee, ligneDeNiveau, medianeDeLaClasse, plafonner,
  premiereLettre,
  reduireLesLettresEquivalentes, verifierLesLignesDeNiveau, type LigneDeNiveau,
} from './etat'
import { filtreR0, type EtatPourCiblage } from '../routeur/ciblage'
import { jugerLaLettre, type EtatNiveau } from '../routeur/lettres'
import type { Mesure } from '../routeur/mesure'

const etat = (p: Partial<EtatNiveau> = {}): EtatNiveau => ({
  lettre: 'C', ancreDerniereDate: null, ancreDerniereValeur: null, lettreInitiale: null,
  profilProvisoire: true, statutRecettePoseLe: null, ...p,
})

const mesure = (p: Partial<Mesure> = {}): Mesure => ({
  id: 'm', competence: 'argumentation', modes: ['composer'], lettreEquivalente: 'C',
  observables: null, lieu: 'classe', forme: 'sommatif', classeId: null, genre: null,
  sondeMontee: false, distanceContexte: null, delaiJours: null, delaiMesures: null,
  deltaV1Vf: null, paireCorrectionJuste: null, paireNouveauCasDetecte: null,
  depotId: null, bonus: false, instrumentVersion: null, mesureAt: '2026-09-01T10:00:00Z', ...p,
})

// ── LE SECOND VERROU ────────────────────────────────────────────────────────

describe('⛔⛔ piège 32 — la colonne porte la valeur PLAFONNÉE, jamais `verdict.lettre`', () => {
  it('sous `profil_provisoire`, `verdict.lettre` est NULL — et la colonne, NON', () => {
    const e = etat({ lettre: 'C', profilProvisoire: true, lettreInitiale: 'C' })
    const v = jugerLaLettre(e, [], { cyclesDepuis: () => 0 })
    assert.equal(v.lettre, null, 'l\'AFFICHAGE est bien supprimé')
    assert.equal(lettreAEcrire(v).lettre, 'C', 'mais la COLONNE porte l\'état')
  })

  it('⭐⭐ ET C\'EST CE QUI GARDE R0 VIVANT PENDANT LE SEGMENT 2', () => {
    const e = etat({ lettre: 'C', profilProvisoire: true, lettreInitiale: 'C' })
    const v = jugerLaLettre(e, [], { cyclesDepuis: () => 0 })
    const pour = (l: string | null): EtatPourCiblage => ({
      competence: 'argumentation', statutRecette: 'evaluee', lettre: l as never,
      signal: null, valeurNonPlafonnee: null, enEntretienN3: false, aProgresse: false,
    })
    // Ce que ferait l'erreur : écrire `verdict.lettre`.
    assert.equal(filtreR0([pour(v.lettre)]).length, 0, 'R0 serait VIDE')
    // Ce que fait ce lot.
    assert.equal(filtreR0([pour(lettreAEcrire(v).lettre)]).length, 1, 'R0 laisse passer')
  })

  it('le plafond borne la colonne : ancre + 2 s\'applique à l\'état', () => {
    assert.equal(plafonner('A', 'C'), 'C')
    assert.equal(plafonner('D', 'C'), 'D')
    assert.equal(plafonner('A', null), 'A')
    assert.equal(plafonner(null, 'C'), null)
  })

  it('une montée bornée par le plafond entre en colonne À LA VALEUR BORNÉE', () => {
    // Trajectoire à B, ancre à D → plafond D+2 = B.
    const e = etat({ lettre: 'D', ancreDerniereValeur: 'D', ancreDerniereDate: '2026-09-01',
      profilProvisoire: false })
    const trois = [mesure({ lieu: 'maison', forme: 'formatif', lettreEquivalente: 'A' }),
      mesure({ id: 'm2', lieu: 'maison', forme: 'formatif', lettreEquivalente: 'A' })]
    const v = jugerLaLettre(e, trois, { cyclesDepuis: () => 0 })
    assert.equal(v.valeurNonPlafonnee, 'C')
    assert.equal(lettreAEcrire(v).lettre, 'C')
  })

  it('sans lettre, rien ne s\'écrit — « sa première vient de sa première ancre »', () => {
    const v = jugerLaLettre(etat({ lettre: null }), [], { cyclesDepuis: () => 0 })
    assert.equal(lettreAEcrire(v).lettre, null)
    assert.match(lettreAEcrire(v).motif, /première ancre/)
  })
})

// ── LE COLD START ───────────────────────────────────────────────────────────

describe('`01-` §4 — le cold start, passation par passation', () => {
  it('une seule mesure : elle-même', () => {
    assert.equal(reduireLesLettresEquivalentes([mesure({ lettreEquivalente: 'D' })]), 'D')
  })

  it('⚠️ deux mesures : LA PLUS BASSE — la prudence du §3, appliquée ici', () => {
    assert.equal(reduireLesLettresEquivalentes([
      mesure({ lettreEquivalente: 'B' }), mesure({ id: '2', lettreEquivalente: 'D' })]), 'D')
  })

  it('trois et plus : la médiane BASSE', () => {
    assert.equal(reduireLesLettresEquivalentes([
      mesure({ lettreEquivalente: 'A' }), mesure({ id: '2', lettreEquivalente: 'C' }),
      mesure({ id: '3', lettreEquivalente: 'E' })]), 'C')
  })

  it('aucune lettre-équivalente exploitable rend `null`, jamais E', () => {
    assert.equal(reduireLesLettresEquivalentes([mesure({ lettreEquivalente: null })]), null)
    assert.equal(reduireLesLettresEquivalentes([]), null)
  })

  it('présent : sa lettre vient de SES mesures, et l\'ancre réelle est enregistrée', () => {
    const p = premiereLettre('argumentation',
      [mesure({ lettreEquivalente: 'C', lieu: 'classe', forme: 'sommatif' })], true, 'B')
    assert.equal(p.lettre, 'C')
    assert.equal(p.source, 'mesures_du_diagnostic')
    assert.deepEqual(p.ancre, { date: '2026-09-01T10:00:00Z', valeur: 'C' })
  })

  it('⚠️ un diagnostic FORMATIF donne une lettre SANS ancre — le régime propre du §9', () => {
    const p = premiereLettre('argumentation',
      [mesure({ lettreEquivalente: 'C', lieu: 'classe', forme: 'formatif' })], true, 'B')
    assert.equal(p.lettre, 'C')
    assert.equal(p.ancre, null)
    assert.match(p.motif, /sans ancre réelle/)
  })

  it('⛔⛔ ABSENT : la médiane de sa classe, et elle N\'ENTRE JAMAIS dans `derniere_ancre`', () => {
    const p = premiereLettre('argumentation', [], true, 'B')
    assert.equal(p.lettre, 'B')
    assert.equal(p.source, 'mediane_de_classe')
    assert.equal(p.ancre, null, 'ce n\'est pas une mesure de cet élève')
  })

  it('⛔ une compétence qu\'AUCUNE passation ne mesure reste SANS LETTRE', () => {
    // Le §10 : ni la Connaissance ni le Questionnement ne sont mesurés en semaine 1.
    const p = premiereLettre('questionnement', [], false, 'B')
    assert.equal(p.lettre, null)
    assert.equal(p.source, 'aucune')
    assert.match(p.motif, /sans lettre/)
  })

  it('absent ET sans médiane de classe : sans lettre, jamais une valeur inventée', () => {
    assert.equal(premiereLettre('argumentation', [], true, null).lettre, null)
  })

  it('la médiane de classe ignore les élèves sans lettre', () => {
    assert.equal(medianeDeLaClasse(['C', null, 'E', null, 'B']), 'C')
    assert.equal(medianeDeLaClasse([null, null]), null)
    assert.equal(medianeDeLaClasse([]), null)
  })
})

// ── LA LIGNE D'ÉTAT ─────────────────────────────────────────────────────────

describe('`07-` §1.3 — la ligne d\'état, et ce qu\'elle n\'envoie jamais', () => {
  it('⛔ les colonnes RETIRÉES le 23/08 lèvent si elles reparaissent', () => {
    for (const cle of CLES_RETIREES_DU_NIVEAU) {
      assert.throws(() => verifierLesLignesDeNiveau([{
        eleve_id: 'E', competence: 'argumentation', lettre: 'C', profil_provisoire: true,
        updated_at: 'now', [cle]: 'evaluee',
      } as never]), LigneDeNiveauInvalide)
    }
  })

  it('⛔ deux lignes de MÊME CLÉ dans un envoi lèvent — Postgres refuserait tout le lot', () => {
    const l: LigneDeNiveau = { eleve_id: 'E', competence: 'argumentation', lettre: 'C',
      profil_provisoire: true, updated_at: 'now' }
    assert.throws(() => verifierLesLignesDeNiveau([l, { ...l }]), LigneDeNiveauInvalide)
  })

  it('⛔ jeux de clés hétérogènes : refusés — les manquantes partiraient à NULL', () => {
    const a: LigneDeNiveau = { eleve_id: 'E', competence: 'argumentation', lettre: 'C',
      profil_provisoire: true, updated_at: 'now', lettre_initiale: 'C', lettre_initiale_at: 'now' }
    const b: LigneDeNiveau = { eleve_id: 'E', competence: 'structure', lettre: 'D',
      profil_provisoire: true, updated_at: 'now' }
    assert.throws(() => verifierLesLignesDeNiveau([a, b]), LigneDeNiveauInvalide)
  })

  it('un envoi homogène passe', () => {
    assert.doesNotThrow(() => verifierLesLignesDeNiveau([
      { eleve_id: 'E', competence: 'argumentation', lettre: 'C', profil_provisoire: true,
        updated_at: 'now' },
      { eleve_id: 'E', competence: 'structure', lettre: 'D', profil_provisoire: true,
        updated_at: 'now' },
    ]))
  })

  it('⭐ `lettre_initiale` s\'écrit UNE FOIS, dans le même geste que la première lettre', () => {
    const neuf = ligneDeNiveau('E', 'argumentation', 'C', etat({ lettreInitiale: null }), null, 'T')
    assert.equal(neuf.lettre_initiale, 'C')
    assert.equal(neuf.lettre_initiale_at, 'T')
    const deja = ligneDeNiveau('E', 'argumentation', 'B', etat({ lettreInitiale: 'C' }), null, 'T')
    assert.equal('lettre_initiale' in deja, false, 'elle ne se réécrit JAMAIS')
  })

  it('sans lettre, aucune `lettre_initiale` ne naît', () => {
    const l = ligneDeNiveau('E', 'argumentation', null, etat({ lettreInitiale: null }), null, 'T')
    assert.equal('lettre_initiale' in l, false)
  })

  it('l\'ancre ne s\'envoie QUE quand elle est neuve — « une clé absente garde sa valeur »', () => {
    const sans = ligneDeNiveau('E', 'argumentation', 'C', etat(), null, 'T')
    assert.equal('ancre_derniere_valeur' in sans, false)
    const avec = ligneDeNiveau('E', 'argumentation', 'C', etat(),
      { date: '2026-09-01', valeur: 'C' }, 'T')
    assert.equal(avec.ancre_derniere_valeur, 'C')
  })

  it('⚠️ `profil_provisoire` se RECOPIE — il bascule à la borne de segment, pas ici', () => {
    assert.equal(ligneDeNiveau('E', 'argumentation', 'C', etat({ profilProvisoire: true }),
      null, 'T').profil_provisoire, true)
    assert.equal(ligneDeNiveau('E', 'argumentation', 'C', etat({ profilProvisoire: false }),
      null, 'T').profil_provisoire, false)
  })
})

// ── L'ESCALADE ET LA MONTÉE ─────────────────────────────────────────────────

describe('`07-` §1.3 — les deux clés que personne n\'avait écrites', () => {
  it('`competences_escalade` est clé (élève × compétence × OBSERVABLE)', () => {
    const l = ligneDEscalade('E', 'argumentation', 'garant', 'N1', null, 'T')
    assert.deepEqual([l.eleve_id, l.competence, l.observable], ['E', 'argumentation', 'garant'])
  })

  it('⭐ la DATE D\'ENTRÉE EN N1 ne se réécrit pas — la double condition de N3 la lit', () => {
    const l = ligneDEscalade('E', 'argumentation', 'garant', 'N2',
      { observable: 'garant', degre: 'N1', entreN1At: '2026-09-01',
        dossierN3OuvertAt: null, dossierN3TraiteAt: null }, 'T')
    assert.equal(l.entre_n1_at, '2026-09-01')
  })

  it('le dossier N3 naît avec N3, et ne renaît pas', () => {
    assert.equal(ligneDEscalade('E', 'argumentation', 'g', 'N1', null, 'T')
      .dossier_n3_ouvert_at, null)
    assert.equal(ligneDEscalade('E', 'argumentation', 'g', 'N3', null, 'T')
      .dossier_n3_ouvert_at, 'T')
    assert.equal(ligneDEscalade('E', 'argumentation', 'g', 'N3',
      { observable: 'g', degre: 'N3', entreN1At: 'x', dossierN3OuvertAt: '2026-09-01',
        dossierN3TraiteAt: null }, 'T').dossier_n3_ouvert_at, '2026-09-01')
  })

  it('⛔ `competences_montee` porte `cran_atteint` ET RIEN DE PLUS', () => {
    const l = ligneDeMontee('E', 'argumentation', 'meso', 6, 'T')
    assert.deepEqual(Object.keys(l).sort(),
      ['competence', 'cran_atteint', 'eleve_id', 'grain', 'updated_at'])
  })
})


// ── LA CHARGE D'`upsert`, GROUPÉE PAR FORME — `C4L12-24` ────────────────────

describe('`grouperParForme` — la garde LÈVE sur une charge hétérogène, et elle a raison', () => {
  it('une charge homogène ne se coupe pas', () => {
    const a = ligneDeNiveau('E', 'argumentation', 'C', etat({ lettreInitiale: 'C' }), null, 'T')
    const b = ligneDeNiveau('E', 'expression', 'B', etat({ lettreInitiale: 'B' }), null, 'T')
    const lots = grouperParForme([a, b])
    assert.equal(lots.length, 1)
    assert.equal(lots[0].length, 2)
  })

  it('⛔⛔ LE CAS RÉEL — une compétence DÉJÀ LETTRÉE et une NEUVE font DEUX formes', () => {
    // C'est exactement la charge que `ecrireLEtatApresMesure` envoyait en un seul
    // lot, et que la base refusait en entier : 13 mesures de `synthese`, ZÉRO
    // ligne de niveau, en production, le 29/08/2026.
    const deja = ligneDeNiveau('E', 'argumentation', 'B', etat({ lettreInitiale: 'C' }), null, 'T')
    const neuve = ligneDeNiveau('E', 'synthese', 'C', etat({ lettreInitiale: null }), null, 'T')
    assert.ok(!('lettre_initiale' in deja), 'la déjà lettrée n\'envoie pas la clé')
    assert.ok('lettre_initiale' in neuve, 'la neuve l\'envoie — c\'est là qu\'est l\'écart')
    const lots = grouperParForme([deja, neuve])
    assert.equal(lots.length, 2, 'deux formes, donc deux lots')
    assert.equal(lots.flat().length, 2, '⭐ et AUCUNE ligne n\'est perdue au passage')
  })

  it('⭐ l\'ANCRE est la seconde paire optionnelle — quatre formes sont possibles', () => {
    const e = etat({ lettreInitiale: 'C' })
    const rien = ligneDeNiveau('E', 'argumentation', 'C', e, null, 'T')
    const ancre = ligneDeNiveau('E', 'expression', 'C', e,
      { date: '2026-09-01', valeur: 'B' }, 'T')
    const neuveEtAncre = ligneDeNiveau('E', 'synthese', 'C', etat({ lettreInitiale: null }),
      { date: '2026-09-01', valeur: 'B' }, 'T')
    const neuve = ligneDeNiveau('E', 'structure', 'C', etat({ lettreInitiale: null }), null, 'T')
    assert.equal(grouperParForme([rien, ancre, neuveEtAncre, neuve]).length, 4)
  })

  it('l\'ORDRE des clés ne fait pas une forme de plus', () => {
    assert.equal(grouperParForme([{ a: 1, b: 2 }, { b: 3, a: 4 }]).length, 1)
  })

  it('une charge vide ne rend aucun lot — et rien à écrire n\'est pas une erreur', () => {
    assert.deepEqual(grouperParForme([]), [])
  })
})
