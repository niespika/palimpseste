import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  etatChaineDeLaCopie, resumerLaFile, demandentUnGeste, ETAPE_MESURE_V1, ETAPE_RETOUR_V1,
  type CopiePourFile, type JobLu,
} from './file-copie'

const job = (p: Partial<JobLu> = {}): JobLu => ({
  etape: ETAPE_MESURE_V1, statut: 'abouti', echec_definitif: false, message: null, ...p,
})
const copie = (p: Partial<CopiePourFile> = {}): CopiePourFile => ({
  attente: [], aUnRetour: false, aUneCopie: true, ...p,
})

test('rien remis : la chaîne n’a rien à lire, et ce n’est pas un défaut', () => {
  const e = etatChaineDeLaCopie(copie({ aUneCopie: false }))
  assert.equal(e.cle, 'sans_copie')
  assert.equal(e.relancable, false)
})

test('copie remise sans aucun job : HORS FILE, pas « en file »', () => {
  const e = etatChaineDeLaCopie(copie())
  assert.equal(e.cle, 'hors_file')
  assert.match(e.phrase, /lot/)
})

test('un job qui attend ou tourne : en file, et rien à faire', () => {
  for (const statut of ['en_attente', 'en_cours']) {
    const e = etatChaineDeLaCopie(copie({ attente: [job({ statut })] }))
    assert.equal(e.cle, 'en_file')
    assert.equal(e.relancable, false)
  }
})

test('abouti AVEC retour : terminé', () => {
  const e = etatChaineDeLaCopie(copie({ attente: [job()], aUnRetour: true }))
  assert.equal(e.cle, 'abouti')
  assert.equal(e.relancable, false)
})

// ⭐ LE CAS DE PROD DU 26/08 — la régression que ce module existe pour empêcher.
test('abouti SANS retour : ce n’est PAS « en file », et ça se relance', () => {
  const e = etatChaineDeLaCopie(copie({
    attente: [
      job({ etape: 'transcription_v1', message: '1 bloc(s)' }),
      job({ message: '3 mesurée(s), 3 écrite(s), 0 déjà là, retour non écrit — retour refusé : règle 2' }),
    ],
  }))
  assert.equal(e.cle, 'sans_retour')
  assert.equal(e.relancable, true)
  assert.match(e.motif ?? '', /retour refusé/)
})

test('le motif vient du job de MESURE, pas du dernier job venu', () => {
  const e = etatChaineDeLaCopie(copie({
    attente: [job({ message: 'motif de la mesure' }), job({ etape: 'transcription_v1', message: 'motif de transcription' })],
  }))
  assert.equal(e.motif, 'motif de la mesure')
})

test('un échec définitif prime sur tout, même si un retour existe', () => {
  const e = etatChaineDeLaCopie(copie({
    attente: [job({ statut: 'echoue', echec_definitif: true, message: 'plafond atteint' })],
    aUnRetour: true,
  }))
  assert.equal(e.cle, 'echec')
  assert.equal(e.relancable, true)
  assert.equal(e.motif, 'plafond atteint')
})

test('les six états sont DISJOINTS et couvrent tout : leur somme vaut le lot', () => {
  const lot: CopiePourFile[] = [
    copie({ aUneCopie: false }),
    copie(),
    copie({ attente: [job({ statut: 'en_attente' })] }),
    copie({ attente: [job()], aUnRetour: true }),
    copie({ attente: [job()] }),
    copie({ attente: [job({ statut: 'echoue', echec_definitif: true })] }),
  ]
  const r = resumerLaFile(lot)
  const somme = r.abouties + r.enFile + r.horsFile + r.sansRetour + r.enEchec + r.sansCopie
  assert.equal(somme, lot.length)
  assert.deepEqual(r, {
    remises: 5, abouties: 1, enFile: 1, horsFile: 1, sansRetour: 1, enEchec: 1, sansCopie: 1,
  })
  // Trois catégories appellent un geste — et « en file » n'en fait pas partie.
  assert.equal(demandentUnGeste(r), 3)
})

test('un lot vide ne compte rien et ne réclame rien', () => {
  const r = resumerLaFile([])
  assert.equal(demandentUnGeste(r), 0)
  assert.equal(r.remises, 0)
})

// ── L'ÉTAPE « RETOUR SEUL » ─────────────────────────────────────────────────

test('un `retour_v1` en file compte comme « en file », pas comme un échec', () => {
  const e = etatChaineDeLaCopie(copie({
    attente: [job(), job({ etape: ETAPE_RETOUR_V1, statut: 'en_attente' })],
  }))
  assert.equal(e.cle, 'en_file')
  assert.equal(e.relancable, false)
})

test('le motif vient de la DERNIÈRE étape jouée, pas de la mesure d’avant', () => {
  const e = etatChaineDeLaCopie(copie({
    attente: [
      job({ message: 'motif du tour de mesure, périmé' }),
      job({ etape: ETAPE_RETOUR_V1, message: 'retour seul — retour refusé : RR4' }),
    ],
  }))
  assert.equal(e.cle, 'sans_retour')
  assert.match(e.motif ?? '', /RR4/)
  // La phrase dit que c'est un SECOND refus — le professeur ne relance pas à l'aveugle.
  assert.match(e.phrase, /de nouveau/)
})

test('un `retour_v1` en échec définitif reste un échec, et se relance', () => {
  const e = etatChaineDeLaCopie(copie({
    attente: [
      job(),
      job({ etape: ETAPE_RETOUR_V1, statut: 'echoue', echec_definitif: true,
        message: 'a changé d’instrument depuis la mesure' }),
    ],
  }))
  assert.equal(e.cle, 'echec')
  assert.equal(e.relancable, true)
  assert.match(e.motif ?? '', /instrument/)
})

test('un retour engendré par le raccourci clôt l’affaire', () => {
  const e = etatChaineDeLaCopie(copie({
    attente: [job(), job({ etape: ETAPE_RETOUR_V1 })], aUnRetour: true,
  }))
  assert.equal(e.cle, 'abouti')
})

// ── ⭐⭐ C5-L4 — LA COPIE ABOUTIE QUI DIT SES COMPÉTENCES ÉCARTÉES ───────────
//
// « Une copie dont le traitement a ABOUTI dit ses compétences écartées quand il
//   y en a. »                                                — `07-` §2, C5-L4
//
// ⚠️ LE MESSAGE DE RÉFÉRENCE EST CELUI DE LA PRODUCTION, pas une invention : il
//    a été lu en base le 27/08 par la file réelle de C5-L3, sur les 13/13 jobs
//    de l'exercice de prod. La forme vient de `motifDesEcartees()`
//    (`utils/chaine/chaine.ts`) — que ce fichier NE PEUT PAS IMPORTER (`chaine.ts`
//    porte `import 'server-only'`, ce qui le rend intestable sous `npm test`).
//    ⭐ C'est le script de couture (`scripts/recette/couture-c5l4.mjs`) qui
//       éprouve le contrat de format PAR EXÉCUTION, contre un vrai job : ces
//       tests-ci tiennent la règle, lui tient l'accord entre l'écrivain et le
//       lecteur.
const MESSAGE_PROD =
  '2 mesurée(s), 2 écrite(s), 0 déjà là, retour écrit, 3 appel(s), 41 s, '
  + '2 écartée(s) — structure, argumentation : mode « expliquer » non couvert par '
  + 'l’instrument de structure (v3.3) | mode « expliquer » non couvert par '
  + 'l’instrument d’argumentation (v4.3)'

test('⭐⭐ abouti AVEC écartées : la phrase ne change pas, le MOTIF apparaît', () => {
  const e = etatChaineDeLaCopie(copie({
    attente: [job({ message: MESSAGE_PROD })], aUnRetour: true,
  }))
  assert.equal(e.cle, 'abouti')
  assert.equal(e.phrase, 'Traitement terminé.')
  // ⛔ Rien n'attend le professeur : une trace n'est pas un état.
  assert.equal(e.relancable, false)
  // Le motif nomme LES DEUX compétences, et il commence au compte.
  assert.match(e.motif ?? '', /^2 écartée\(s\) — structure, argumentation/)
  assert.match(e.motif ?? '', /argumentation/)
  // ⚠️ Il ne recopie PAS le bilan qui le précède : « 2 mesurée(s) » n'est pas
  //    une nouvelle, et le noyer dedans ferait perdre ce qui compte.
  assert.equal((e.motif ?? '').includes('mesurée(s)'), false)
  assert.equal((e.motif ?? '').includes('appel(s)'), false)
})

test('⛔ abouti SANS écartées : le silence est conservé — c’est la règle', () => {
  const sansRien = etatChaineDeLaCopie(copie({
    attente: [job({ message: '2 mesurée(s), 2 écrite(s), 0 déjà là, retour écrit, 3 appel(s), 12 s' })],
    aUnRetour: true,
  }))
  assert.equal(sansRien.cle, 'abouti')
  assert.equal(sansRien.motif, null)
  // Et sans message du tout non plus.
  assert.equal(etatChaineDeLaCopie(copie({ attente: [job()], aUnRetour: true })).motif, null)
})

test('⚠️ deux autres textes du dépôt disent « écartée(s) » — ni l’un ni l’autre ne matche', () => {
  // `chaine.ts` : « N compétence(s) sondée(s) écartée(s) DU RETOUR — une sonde
  // est silencieuse » ; `app/passation/actions.ts` : « N sans copie remise,
  // écartée(s) ». Aucun n'a le tiret cadratin qui suit le compte.
  for (const faux of [
    'retour écrit, 3 appel(s), 12 s | 2 compétence(s) sondée(s) écartée(s) du retour — une sonde est silencieuse',
    '5 sans copie remise, écartée(s)',
  ]) {
    const e = etatChaineDeLaCopie(copie({ attente: [job({ message: faux })], aUnRetour: true }))
    assert.equal(e.motif, null, faux)
  }
})

test('⭐ c’est la DERNIÈRE étape qui parle, ici comme pour `sans_retour`', () => {
  // Un `retour_v1` rejoué après un `mesure_v1` raconte le tour courant ; le
  // message de la mesure décrit celui d'avant.
  const e = etatChaineDeLaCopie(copie({
    attente: [
      job({ message: 'retour écrit, 3 appel(s), 12 s, 4 écartée(s) — a, b, c, d : périmé' }),
      job({ etape: ETAPE_RETOUR_V1, message: MESSAGE_PROD }),
    ],
    aUnRetour: true,
  }))
  assert.equal(e.cle, 'abouti')
  assert.match(e.motif ?? '', /^2 écartée\(s\)/)
  assert.equal((e.motif ?? '').includes('périmé'), false)
})

test('⛔ le chemin où TOUT est écarté ne bouge pas — il servait déjà son motif', () => {
  // Aucun squelette → aucun retour → `sans_retour`, qui sert le message ENTIER
  // (pas seulement sa part « écartées »). Ce test est la non-régression du
  // chemin que C5-L3 a laissé juste.
  const e = etatChaineDeLaCopie(copie({
    attente: [job({ message: '0 mesurée(s), 0 écrite(s), retour non écrit, 2 écartée(s) — structure, argumentation : mode non couvert' })],
    aUnRetour: false,
  }))
  assert.equal(e.cle, 'sans_retour')
  assert.equal(e.relancable, true)
  // ⚠️ Le motif d'un `sans_retour` est le message ENTIER — on n'y touche pas.
  assert.match(e.motif ?? '', /^0 mesurée\(s\)/)
})

test('⚠️ un échec définitif prime toujours — même avec des écartées au message', () => {
  const e = etatChaineDeLaCopie(copie({
    attente: [job({ echec_definitif: true, statut: 'echoue', message: MESSAGE_PROD })],
    aUnRetour: true,
  }))
  assert.equal(e.cle, 'echec')
  assert.equal(e.relancable, true)
  // Et son motif reste le message ENTIER : le professeur doit tout lire.
  assert.match(e.motif ?? '', /^2 mesurée\(s\)/)
})

test('⛔ les six comptes restent DISJOINTS : une aboutie à motif reste « aboutie »', () => {
  const r = resumerLaFile([
    copie({ attente: [job({ message: MESSAGE_PROD })], aUnRetour: true }),
    copie({ attente: [job()], aUnRetour: true }),
  ])
  assert.equal(r.abouties, 2)
  assert.equal(r.sansRetour, 0)
  // ⭐ ET RIEN N'ATTEND DE GESTE : c'est pourquoi ce lot n'a PAS ajouté un
  //    septième compteur à « LA FILE ». Les six sont disjoints et leur somme
  //    vaut le nombre de copies ; « aboutie avec écartées » n'est pas un état
  //    de plus, c'est la MÊME aboutie qui a quelque chose à dire.
  assert.equal(demandentUnGeste(r), 0)
})
