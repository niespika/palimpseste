import test from 'node:test'
import assert from 'node:assert/strict'
import {
  defautCopieDeCarte, defautDeLongueur, defautExempleRepris, defautOptionLongue, defautsDeLecture, decrireDefautPourLeModele, ecartDeLongueur,
  exemplesRepris, phraseEcartees,
} from './quazian-controle-questions'

/** Une réponse de `car` caractères en `mots` mots (des « x » séparés d'espaces). */
function reponse(car: number, mots: number) {
  const lettres = car - (mots - 1)
  return Array.from({ length: mots }, (_, i) => 'x'.repeat(Math.floor(lettres / mots) + (i < lettres % mots ? 1 : 0))).join(' ')
}
// Une question dont les réponses ont les [caractères, mots] donnés ; la bonne est la première.
const q = (...options: [number, number][]) => ({ enonce: 'Question ?', options: options.map(([c, m]) => reponse(c, m)), index_correct: 0 })

// Les 15 questions du quiz de T5 (22/09), mesurées en prod le 23/09 : [caractères,
// mots] de la bonne réponse, puis des trois leurres.
const T5: [number, number][][] = [
  [[37, 6], [37, 6], [40, 6], [35, 6]], [[7, 1], [8, 1], [7, 1], [10, 1]], [[39, 4], [32, 3], [31, 4], [24, 4]],
  [[6, 1], [8, 1], [9, 1], [4, 1]], [[103, 15], [55, 8], [77, 11], [65, 8]], [[70, 10], [38, 6], [44, 8], [36, 6]],
  [[76, 15], [50, 6], [49, 7], [52, 9]], [[40, 6], [40, 6], [41, 5], [35, 6]], [[29, 6], [30, 4], [25, 3], [19, 3]],
  [[60, 9], [52, 8], [67, 10], [51, 11]], [[74, 14], [66, 12], [74, 12], [60, 12]], [[68, 11], [66, 9], [52, 8], [50, 8]],
  [[87, 12], [75, 12], [53, 8], [57, 10]], [[136, 23], [86, 17], [98, 16], [88, 19]], [[160, 29], [93, 17], [101, 17], [101, 18]],
]

test('longueur — le seuil de Louis sur T5 : 5 questions au-delà de deux mots', () => {
  const prises = T5.map((o, i) => (defautDeLongueur(q(...o)) ? i : -1)).filter((i) => i >= 0)
  // Paris, proposition, crédence, Inès, « objective et exclusive ».
  assert.deepEqual(prises, [4, 5, 6, 13, 14])
})
test('longueur — un ou deux mots de plus ne se voient pas : ni le vélo, ni la cohérence', () => {
  assert.equal(defautDeLongueur(q(...T5[2])), null, 'vélo : +7 caractères, moins d’un mot')
  assert.equal(defautDeLongueur(q(...T5[12])), null, 'cohérence : +12 caractères, moins de deux mots')
  assert.equal(defautDeLongueur(q([60, 10], [48, 8], [30, 5], [30, 5])), null, 'deux mots de plus, tout juste')
})
test('longueur — l’écart se compte en mots MOYENS, pas en mots : deux mots longs se voient', () => {
  // La « proposition » de T5 : 10 mots contre 8, mais 70 caractères contre 44.
  const e = ecartDeLongueur(q(...T5[5]))
  assert.equal(e.bonne - e.leurre, 26)
  assert.ok(e.mots > 4 && e.mots < 4.3)
  assert.deepEqual(defautDeLongueur(q(...T5[5])), { type: 'longueur', bonne: 70, leurre: 44, mots: 4 })
})
test('longueur — noms propres, bonne plus courte, espaces de bord : rien', () => {
  assert.equal(defautDeLongueur({ enonce: '?', options: ['Protagoras', 'Kant', 'Platon', 'Hume'], index_correct: 0 }), null)
  assert.equal(defautDeLongueur(q([30, 5], [50, 8], [50, 8], [50, 8])), null)
  assert.equal(defautDeLongueur({ enonce: '?', options: [' court ' + ' '.repeat(40), 'court', 'court', 'court'], index_correct: 0 }), null)
})

test('option trop longue — au-delà de 90 caractères, quelle que soit la réponse', () => {
  assert.equal(defautOptionLongue(q([90, 14], [60, 10], [60, 10], [60, 10])), null)
  assert.deepEqual(defautOptionLongue(q([60, 10], [91, 14], [60, 10], [60, 10])), { type: 'option_longue', longueur: 91 })
  // Les quatre réponses de « objective et exclusive » (T5) : la bonne fait 160 caractères.
  assert.equal(defautOptionLongue(q(...T5[14]))?.type, 'option_longue')
})

// Des cartes du périmètre de T5, telles qu'en prod (recto / verso).
const CARTES = [
  { recto: 'Quel type de connaissance illustre « Je sais faire du vélo » ?', verso: 'Le savoir-faire (connaissance pratique)' },
  { recto: 'Quelle est la distinction entre croyance a priori et croyance a posteriori ?', verso: "A priori : justification indépendante de l'expérience (ex. 1+1=2). A posteriori : justification dépendante de l'expérience (ex. il pleut)." },
  { recto: "Noé annonce au hasard qu'il pleuvra à 15 h, et il pleut effectivement. Savait-il qu'il allait pleuvoir ?", verso: "Non : sa croyance était vraie mais non justifiée — c'est un coup de chance, pas une connaissance." },
  { recto: "Sous une lumière verte, Inès croit qu'une feuille blanche est verte. Sait-elle que la feuille est verte ?", verso: "Non : la proposition est fausse — la condition de vérité n'est pas satisfaite, même si sa croyance est justifiée par son expérience." },
  { recto: 'Thomas Reid objecte que le témoignage est une source à part entière car…', verso: 'Un jeune enfant croit ses parents avant toute expérience de leur fiabilité.' },
  { recto: "Pour le béhaviorisme, « Paul croit qu'il va pleuvoir » ne décrit aucun état intérieur.", verso: 'Le béhaviorisme réduit les croyances à des dispositions comportementales.' },
  { recto: 'Pour Descartes, on peut douter de tout sauf de quoi ?', verso: 'du fait que je pense (cogito)' },
]

test('copie de carte — la bonne réponse reprend 3 mots d’affilée de plus qu’aucun leurre : réécrite', () => {
  const cartes = [...CARTES, { recto: 'Pourquoi la vérité est-elle décisive ?', verso: 'La vérité est une condition nécessaire de la {{connaissance}}.' }]
  // Question du banc (23/09) : 9 mots d'affilée de la carte, aucun leurre au-delà de 4.
  const q9 = { enonce: '?', index_correct: 0, options: [
    'La vérité est une condition nécessaire de la connaissance',
    'Une croyance fausse peut être justifiée par l’expérience',
    'La justification suffit à distinguer savoir et opinion',
    'Une connaissance peut être révisée avec le temps',
  ] }
  assert.deepEqual(defautCopieDeCarte(q9, cartes), { type: 'copie_carte', bonne: 9, leurre: 2 })
  // Les leurres écrits dans la langue du cours : l'écart tombe, plus rien.
  const coursPartout = { ...q9, options: [q9.options[0],
    'Le savoir-faire (connaissance pratique)', 'Un jeune enfant croit ses parents avant toute expérience', q9.options[3]] }
  assert.equal(defautCopieDeCarte(coursPartout, cartes), null)
  // Reformulée : plus rien non plus.
  assert.equal(defautCopieDeCarte({ ...q9, options: ['On ne sait que ce qui est vrai', ...q9.options.slice(1)] }, cartes), null)
})
test('copie de carte — deux mots d’écart ne comptent pas ; une bonne réponse qui ne recopie rien non plus', () => {
  const cartes = [{ recto: 'Qui ?', verso: 'Socrate cherche à sortir de l’opinion.' }]
  assert.equal(defautCopieDeCarte({ enonce: '?', index_correct: 0, options: ['Socrate cherche à sortir', 'Platon', 'Kant', 'Hume'] }, cartes)?.type, 'copie_carte')
  assert.equal(defautCopieDeCarte({ enonce: '?', index_correct: 0, options: ['Socrate cherche', 'Platon', 'Kant', 'Hume'] }, cartes), null)
  assert.equal(defautCopieDeCarte({ enonce: '?', index_correct: 1, options: ['Socrate cherche à sortir', 'Platon', 'Kant', 'Hume'] }, cartes), null)
})

test('exemple repris — les 4 applications du quiz de T5 sont reconnues', () => {
  const enonces = [
    '« Je sais faire du vélo » illustre quel type de connaissance ?',
    'Selon la distinction a priori / a posteriori, comment classer la proposition « 1 + 1 = 2 » ?',
    "Noé annonce au hasard qu'il pleuvra à 15 h, et il pleut effectivement. Peut-on dire qu'il savait qu'il allait pleuvoir ?",
    'Sous une lumière verte, Inès croit que la feuille devant elle est verte. Sa croyance est-elle une connaissance ?',
  ]
  for (const e of enonces) assert.ok(exemplesRepris(e, CARTES).length > 0, e)
  assert.ok(exemplesRepris(enonces[0], CARTES).includes('« Je sais faire du vélo »'))
  assert.ok(exemplesRepris(enonces[1], CARTES).includes('« 1 + 1 = 2 »'), 'espaces et accents ignorés')
  assert.ok(exemplesRepris(enonces[3], CARTES).includes('Inès'))
})
test('exemple repris — le personnage seul suffit, même reformulé', () => {
  assert.deepEqual(exemplesRepris("Noé devine qu'il fera beau demain, sans consulter la météo. Le savait-il ?", CARTES), ['Noé'])
})
// Ce contrôle voit un personnage, une citation, une formule ou une tournure propre
// à une carte — pas une STRUCTURE : Sofia sous un éclairage orange reprend le
// schéma d'Inès sans en reprendre un mot, et passe. Voulu : « Je n'ai pas de
// problème avec la reprise avec d'autres noms » (Louis, 23/09).
test('exemple repris — des cas écrits par le générateur au banc, sans mot de la carte, passent', () => {
  for (const e of [
    'Marc achète un billet de loterie et affirme, sans aucun calcul, que ce numéro sera gagnant. Le numéro est tiré. Savait-il ?',
    "Sous un éclairage orange, Sofia croit qu'un mur blanc est orange. Sa perception justifie sa croyance, mais le mur est blanc en réalité. Sait-elle que le mur est orange ?",
    "Clara maîtrise la nage papillon sans pouvoir l'expliquer. Quel type de connaissance cela illustre-t-il ?",
    'Quelle notion illustre « Tous les triangles ont trois côtés » ?',
  ]) assert.deepEqual(exemplesRepris(e, CARTES), [], e)
})
test('exemple repris — ni un prénom d’auteur, ni un interrogatif, ni un mot de début de phrase', () => {
  // « Thomas » n'existe dans les cartes que devant « Reid » : pas un personnage.
  assert.deepEqual(exemplesRepris('Thomas lit un roman policier et devine le coupable au hasard. Le savait-il ?', CARTES), [])
  // « Paul », lui, est le personnage d'une carte.
  assert.deepEqual(exemplesRepris('Paul prend son parapluie chaque matin. Que dirait un béhavioriste ?', CARTES), ['Paul'])
  assert.deepEqual(exemplesRepris('Quelle forme de connaissance Léa possède-t-elle ? Sous la pluie, elle court.', CARTES), [])
})
test('exemple repris — une amorce de question commune ne fait pas un exemple', () => {
  const cartes = [...CARTES, { recto: "Lina croit que 15 × 4 = 60, et elle vient de le vérifier par un calcul correct. Peut-on dire qu'elle le sait ?", verso: 'Oui.' }]
  // Écartée à tort au banc (23/09) : « peut on dire qu elle » n'est fait que de mots vides.
  assert.deepEqual(exemplesRepris("Léa parie qu'il neigera demain, et il neige. Peut-on dire qu'elle le savait ?", cartes), [])
  assert.deepEqual(exemplesRepris("Léa annonce au hasard qu'il pleuvra, et il pleut. Le savait-elle ?", cartes), ['« …annonce au hasard qu il… »'])
})
test('exemple repris — reprises littérales qui passaient (revue du 23/09)', () => {
  const cartes = [...CARTES,
    { recto: "Lina croit que 15 × 4 = 60, et elle vient de le vérifier par un calcul correct. Peut-on dire qu'elle le sait ?", verso: 'Oui.' },
    { recto: "Pour Locke, l'esprit à la naissance est {{une tabula rasa}}.", verso: 'Empirisme.' },
  ]
  assert.ok(exemplesRepris("Léa annonce au hasard qu'il pleuvra à 15h, et il pleut effectivement. Le savait-elle ?", cartes).length > 0, '15h = 15 h')
  assert.ok(exemplesRepris('Tom croit que 15 x 4 = 60. Le sait-il ?', cartes).includes('15 x 4 = 60'), 'x = ×, sans guillemets')
  assert.ok(exemplesRepris('Tom croit que 1 + 1 = 2. Cette croyance est-elle a priori ?', cartes).includes('1 + 1 = 2'))
  assert.ok(exemplesRepris('Selon Tom, l’esprit est “une tabula rasa”. Quel courant ?', cartes).includes('« une tabula rasa »'), 'guillemets anglais, trou {{…}}')
})
test('exemple repris — ce qui passait pour une reprise et n’en est pas une (revue du 23/09)', () => {
  const cartes = [...CARTES,
    { recto: 'Quel type de connaissance illustre « Je sais nager » ?', verso: 'Le savoir-faire.' },
  ]
  // Tournure présente dans plusieurs cartes : la langue du cours.
  assert.deepEqual(exemplesRepris('Tom joue du piano depuis dix ans. Quel type de connaissance illustre sa pratique ?', cartes), [])
  // « savait-il qu'il allait » : des mots vides.
  assert.deepEqual(exemplesRepris("Hugo parie sur un cheval, qui gagne. Savait-il qu'il allait gagner ?", cartes), [])
  // « je sais » : deux mots, une tournure ; « Paul » dans « Jean-Paul » : pas le personnage.
  assert.deepEqual(exemplesRepris('Karim répond « je sais » à chaque question. Le sait-il vraiment ?', cartes), [])
  assert.deepEqual(exemplesRepris('Zoé lit une page de Jean-Paul Sartre. Quelle connaissance en tire-t-elle ?', cartes), [])
})
test('exemple repris — ne vise que les applications', () => {
  const enonce = '« Je sais faire du vélo » illustre quel type de connaissance ?'
  const base = { enonce, options: ['a', 'b', 'c', 'd'], index_correct: 0 }
  assert.equal(defautExempleRepris({ ...base, nature: 'connaissance' }, CARTES), null)
  assert.equal(defautExempleRepris(base, CARTES), null)
  assert.equal(defautExempleRepris({ ...base, nature: 'application' }, CARTES)?.type, 'exemple_repris')
})

test('lecture à l’aveugle — accord, autre réponse, fait manquant', () => {
  const application = { ...q([10, 2], [10, 2], [10, 2], [10, 2]), nature: 'application' as const }
  assert.deepEqual(defautsDeLecture(application, undefined), [])
  assert.deepEqual(defautsDeLecture(application, { choix: 0, defendable: -1, complet: true, manque: '' }), [])
  assert.deepEqual(defautsDeLecture(application, { choix: 2, defendable: -1, complet: true, manque: '' }), [{ type: 'autre_reponse', choix: 2 }])
  assert.deepEqual(
    defautsDeLecture(application, { choix: 0, defendable: -1, complet: false, manque: ' La couleur réelle de la feuille. ' }),
    [{ type: 'premisse_absente', manque: 'La couleur réelle de la feuille.' }],
  )
  // C'est le booléen qui tranche : « Aucun fait manquant. » écrit dans `manque`
  // n'est plus lu comme un fait manquant (revue du 23/09).
  for (const texte of ['Aucun fait manquant.', 'Rien ne manque.', 'N/A', 'Aucun fait manquant : l’énoncé est complet.']) {
    assert.deepEqual(defautsDeLecture(application, { choix: 0, defendable: -1, complet: true, manque: texte }), [], texte)
  }
  assert.equal(defautsDeLecture(application, { choix: 0, defendable: -1, complet: false, manque: '' })[0].type, 'premisse_absente')
})
test('lecture à l’aveugle — une question de cours ne se juge pas à l’aveugle', () => {
  const cours = { ...q([10, 2], [10, 2], [10, 2], [10, 2]), nature: 'connaissance' as const }
  assert.deepEqual(defautsDeLecture(cours, { choix: 0, defendable: -1, complet: false, manque: "La position de Chang n'est pas décrite." }), [])
  // L'ordre des conditions CVJ est une convention du cours : le relecteur l'ignore.
  assert.deepEqual(defautsDeLecture(cours, { choix: 1, defendable: 2, complet: true, manque: '' }), [])
})
test('lecture à l’aveugle — une autre réponse qui se défend aussi', () => {
  const application = { ...q([10, 2], [10, 2], [10, 2], [10, 2]), nature: 'application' as const }
  assert.deepEqual(defautsDeLecture(application, { choix: 0, defendable: 2, complet: true, manque: '' }), [{ type: 'deux_reponses', autre: 2 }])
  assert.deepEqual(defautsDeLecture(application, { choix: 0, defendable: 0, complet: true, manque: '' }), [], 'sa propre réponse ne compte pas')
  // Le relecteur a choisi une autre réponse : un seul défaut, pas deux.
  assert.deepEqual(defautsDeLecture(application, { choix: 1, defendable: 0, complet: true, manque: '' }), [{ type: 'autre_reponse', choix: 1 }])
})

test('ce qu’on dit au modèle — les nombres, l’exemple, le fait, la réponse choisie', () => {
  const question = { enonce: '?', options: ['juste', 'faux A', 'faux B', 'faux C'], index_correct: 0 }
  assert.match(decrireDefautPourLeModele(question, { type: 'longueur', bonne: 70, leurre: 44, mots: 4 }), /70 caractères.*44 : environ 4 mots de plus/)
  assert.match(decrireDefautPourLeModele(question, { type: 'exemple_repris', reprises: ['Noé'] }), /Noé.*cas neuf/)
  assert.match(decrireDefautPourLeModele(question, { type: 'premisse_absente', manque: 'La feuille est blanche.' }), /La feuille est blanche\. Écris ce fait/)
  assert.match(decrireDefautPourLeModele(question, { type: 'autre_reponse', choix: 2 }), /« faux B »/)
})
test('ce qu’on dit au professeur — nombre accordé, motifs sans doublon', () => {
  assert.equal(phraseEcartees([]), '')
  assert.equal(
    phraseEcartees([{ defauts: [{ type: 'longueur', bonne: 9, leurre: 1, mots: 3 }] }]),
    '1 question écartée au contrôle (bonne réponse plus longue que les autres).',
  )
  assert.equal(
    phraseEcartees([
      { defauts: [{ type: 'longueur', bonne: 9, leurre: 1, mots: 3 }, { type: 'premisse_absente', manque: 'x' }] },
      { defauts: [{ type: 'longueur', bonne: 9, leurre: 1, mots: 3 }] },
    ]),
    '2 questions écartées au contrôle (bonne réponse plus longue que les autres, énoncé incomplet).',
  )
})
