// « Deux mesures d'assiduité, ET RIEN DE PLUS » (`06-` §5). Les deux seuils sont
// des RÉGLAGES — « jamais une constante en dur » — d'où leur passage en paramètre.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  SEUILS_DE_DEMARRAGE, completion, semaineFaite, assiduiteDeLEleve, inactiviteDeLaClasse,
  bandeDeLaFrise, vueFine, retraitCompteDansLaSemaine, estRendu, entreAuDenominateur,
  type SemaineEleve, type SeuilsAssiduite,
} from './assiduite'

const seuils: SeuilsAssiduite = { ...SEUILS_DE_DEMARRAGE }

const sem = (assignes: number, termines: number, o: Partial<SemaineEleve> = {}): SemaineEleve => ({
  cycleLundi: '2026-09-07', exercicesAssignes: assignes, exercicesTermines: termines,
  enVacances: false, ...o })

// ── La semaine « faite » ───────────────────────────────────────────────────

test('une semaine est FAITE à TROIS QUARTS des assignés rendus', () => {
  assert.equal(semaineFaite(sem(4, 3), seuils), true, '3/4 = le seuil, atteint')
  assert.equal(semaineFaite(sem(4, 2), seuils), false)
  assert.equal(semaineFaite(sem(8, 6), seuils), true)
})

test('LE SEUIL EST UN RÉGLAGE — jamais une constante en dur', () => {
  const exigeant: SeuilsAssiduite = { ...seuils, semaineFaite: 1 }
  assert.equal(semaineFaite(sem(4, 3), exigeant), false)
  const laxiste: SeuilsAssiduite = { ...seuils, semaineFaite: 0.5 }
  assert.equal(semaineFaite(sem(4, 2), laxiste), true)
})

test('une semaine SANS EXERCICE ASSIGNÉ est faite PAR CONSTRUCTION — jamais 0/0', () => {
  assert.equal(semaineFaite(sem(0, 0), seuils), true)
  assert.equal(completion(sem(0, 0)), null, 'et sa complétion n\'est pas 0')
})

// ── Le pourcentage d'assiduité ─────────────────────────────────────────────

test('% = semaines faites ÷ (semaines du semestre − semaines de VACANCES)', () => {
  const a = assiduiteDeLEleve([sem(4, 4), sem(4, 4), sem(4, 0), sem(4, 0)], seuils)
  assert.equal(a.denominateur, 4)
  assert.equal(a.semainesFaites, 2)
  assert.equal(a.pourcentage, 0.5)
})

test('LES SEMAINES DE VACANCES SORTENT DU DÉNOMINATEUR', () => {
  const a = assiduiteDeLEleve([sem(4, 4), sem(0, 0, { enVacances: true }),
    sem(0, 0, { enVacances: true })], seuils)
  assert.equal(a.denominateur, 1, 'deux semaines de vacances retirées')
  assert.equal(a.pourcentage, 1)
})

test('le travail de vacances ajoute AU PLUS UNE SEMAINE, SUR TOUT LE SEMESTRE', () => {
  const troisSemainesDeVacancesTravaillees = [
    sem(4, 0), sem(4, 0), sem(4, 0), sem(4, 0),
    sem(2, 2, { enVacances: true }), sem(2, 2, { enVacances: true }),
    sem(2, 2, { enVacances: true }),
  ]
  const a = assiduiteDeLEleve(troisSemainesDeVacancesTravaillees, seuils)
  assert.equal(a.bonusVacances, 1, 'une seule, jamais trois')
  assert.equal(a.semainesFaites, 1)
  assert.equal(a.denominateur, 4)
})

test('des vacances NON travaillées n\'ajoutent rien', () => {
  const a = assiduiteDeLEleve([sem(4, 4), sem(2, 0, { enVacances: true })], seuils)
  assert.equal(a.bonusVacances, 0)
})

test('le pourcentage ne dépasse jamais 100 %, bonus compris', () => {
  const a = assiduiteDeLEleve([sem(4, 4), sem(2, 2, { enVacances: true })], seuils)
  assert.equal(a.pourcentage, 1)
})

test('un semestre entièrement en vacances ne divise pas par zéro', () => {
  const a = assiduiteDeLEleve([sem(0, 0, { enVacances: true })], seuils)
  assert.equal(a.denominateur, 0)
  assert.equal(a.pourcentage, null)
})

// ── Le taux d'inactivité de la classe ──────────────────────────────────────

test('le taux d\'inactivité est LA PART des élèves dont la semaine n\'est pas faite', () => {
  const i = inactiviteDeLaClasse([sem(4, 4), sem(4, 4), sem(4, 0), sem(4, 0)], seuils)
  assert.equal(i.eleves, 4)
  assert.equal(i.elevesInactifs, 2)
  assert.equal(i.tauxInactivite, 0.5)
})

test('« UN SEUL SIGNAL » : il ne distingue pas « rien rendu » de « pas assez rendu »', () => {
  const rienRendu = inactiviteDeLaClasse([sem(4, 0)], seuils)
  const pasAssez = inactiviteDeLaClasse([sem(4, 2)], seuils)
  assert.equal(rienRendu.tauxInactivite, pasAssez.tauxInactivite, 'le même booléen, au même seuil')
})

test('la CLASSE a fait sa semaine quand LES TROIS QUARTS de ses élèves ont fait la leur', () => {
  const troisSurQuatre = inactiviteDeLaClasse([sem(4, 4), sem(4, 4), sem(4, 4), sem(4, 0)], seuils)
  assert.equal(troisSurQuatre.contratRempli, true)
  assert.equal(troisSurQuatre.avertissement, null)

  const deuxSurQuatre = inactiviteDeLaClasse([sem(4, 4), sem(4, 4), sem(4, 0), sem(4, 0)], seuils,
    'THLP')
  assert.equal(deuxSurQuatre.contratRempli, false)
  assert.match(deuxSurQuatre.avertissement ?? '', /THLP/)
  assert.match(deuxSurQuatre.avertissement ?? '', /n'a pas fait sa semaine/)
})

test('l\'avertissement dit que le contrat n\'est pas rempli — JAMAIS ce qu\'il faut faire', () => {
  const i = inactiviteDeLaClasse([sem(4, 0), sem(4, 0)], seuils)
  assert.ok(!/doit|impose|bloque|note/i.test(i.avertissement ?? ''),
    'ce que le professeur en fait lui appartient')
})

test('une classe vide ne divise pas par zéro', () => {
  const i = inactiviteDeLaClasse([], seuils)
  assert.equal(i.tauxInactivite, null)
  assert.equal(i.contratRempli, true)
})

// ── La vue fine — « une VUE, pas une troisième mesure » ────────────────────

test('les trois couleurs : VERT du seuil à 100 %, ORANGE dès la moitié, ROUGE sous', () => {
  assert.equal(bandeDeLaFrise(sem(4, 4), seuils), 'vert')
  assert.equal(bandeDeLaFrise(sem(4, 3), seuils), 'vert', 'la borne haute EST le seuil')
  assert.equal(bandeDeLaFrise(sem(4, 2), seuils), 'orange', 'la moitié, sans atteindre le seuil')
  assert.equal(bandeDeLaFrise(sem(4, 1), seuils), 'rouge', 'sous la moitié')
  assert.equal(bandeDeLaFrise(sem(4, 0), seuils), 'rouge')
})

test('LA MOITIÉ EST UN RÉGLAGE, comme le seuil', () => {
  const strict: SeuilsAssiduite = { ...seuils, borneBasseFrise: 0.7 }
  assert.equal(bandeDeLaFrise(sem(10, 6), strict), 'rouge', '0,6 est sous 0,7')
  assert.equal(bandeDeLaFrise(sem(10, 6), seuils), 'orange', 'et orange au réglage par défaut')
})

test('la vue fine rend LA FRISE (la distribution) ET LE TABLEAU (qui)', () => {
  const { frise, tableau } = vueFine([{
    cycleLundi: '2026-09-07',
    eleves: [
      { eleveId: 'a', nom: 'Alice', assignes: 4, termines: 4 },
      { eleveId: 'b', nom: 'Bob', assignes: 4, termines: 2 },
      { eleveId: 'c', nom: 'Chloé', assignes: 4, termines: 0 },
    ],
  }], seuils)
  assert.deepEqual(frise[0], { cycleLundi: '2026-09-07', vert: 1, orange: 1, rouge: 1, eleves: 3 })
  const lignes = tableau.get('2026-09-07')!
  assert.equal(lignes[1].nom, 'Bob')
  assert.equal(lignes[1].completion, 0.5, 'rendus ÷ assignés')
  assert.equal(lignes[2].bande, 'rouge')
})

test('la vue fine distingue « tous à 70 % » de « 70 % à 100 % et 30 % à 0 % »', () => {
  // Les deux manquent le contrat, et n'appellent pas la même réponse.
  const tousMoyens = vueFine([{ cycleLundi: 'x', eleves: [
    { eleveId: 'a', nom: 'A', assignes: 10, termines: 7 },
    { eleveId: 'b', nom: 'B', assignes: 10, termines: 7 },
  ] }], seuils)
  const clive = vueFine([{ cycleLundi: 'x', eleves: [
    { eleveId: 'a', nom: 'A', assignes: 10, termines: 10 },
    { eleveId: 'b', nom: 'B', assignes: 10, termines: 0 },
  ] }], seuils)
  assert.deepEqual([tousMoyens.frise[0].vert, tousMoyens.frise[0].orange, tousMoyens.frise[0].rouge],
    [0, 2, 0])
  assert.deepEqual([clive.frise[0].vert, clive.frise[0].orange, clive.frise[0].rouge], [1, 0, 1])
})

// ── Le retrait — « pour l'avenir SEULEMENT » ───────────────────────────────

test('un retrait sur une semaine PASSÉE ne recalcule rien', () => {
  const r = retraitCompteDansLaSemaine('2026-09-07', '2026-09-14')
  assert.equal(r.recalculer, false)
  assert.match(r.motif, /déjà arrêtée/)
})

test('un retrait sur la semaine EN COURS sort bien du dénominateur', () => {
  assert.equal(retraitCompteDansLaSemaine('2026-09-14', '2026-09-14').recalculer, true)
})

test('`retire` sort du dénominateur ; `abandonne` Y RESTE — l\'assiduité mesure L\'ÉLÈVE', () => {
  assert.equal(entreAuDenominateur('retire'), false)
  assert.equal(entreAuDenominateur('abandonne'), true, 'un non-geste de l\'élève reste compté')
  assert.equal(entreAuDenominateur('assigne'), true)
})

test('⭐⭐ `non_fait` NE COMPTE PAS COMME RENDU, ET RESTE AU DÉNOMINATEUR', () => {
  // ⛔ C'est TOUT le dessin de l'item 77, et il tient sur ces deux lignes.
  //    « L'exercice est considéré comme non fait » (Louis, 28/08) : le dépôt a
  //    eu lieu — la désignation couvrait le matériau —, il ne se juge pas, et il
  //    ne se compte pas. Si `non_fait` entrait dans `STATUTS_RENDUS`, le
  //    ratisseur aurait fait sa semaine ; s'il sortait du dénominateur, il
  //    n'aurait rien eu à faire du tout. Ni l'un ni l'autre.
  assert.equal(estRendu('non_fait'), false, 'un ratissage n\'est pas un rendu')
  assert.equal(entreAuDenominateur('non_fait'), true, 'et il ne s\'efface pas de la semaine')
  // ⚠️ Il ne se confond pas avec `abandonne` : celui-là dit « jamais ouvert ».
  //    Ils tombent au même endroit pour l'assiduité, et c'est un hasard — leurs
  //    libellés d'écran, eux, disent deux choses différentes.
  assert.equal(estRendu('abandonne'), false)
})

test('ce qui compte comme RENDU s\'arrête au dépôt de la v1', () => {
  assert.equal(estRendu('v1_remis'), true)
  assert.equal(estRendu('clos'), true)
  assert.equal(estRendu('assigne'), false)
  assert.equal(estRendu('ouvert'), false)
  assert.equal(estRendu('abandonne'), false)
  assert.equal(estRendu('retire'), false)
})
