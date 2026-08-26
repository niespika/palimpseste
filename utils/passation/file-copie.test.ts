import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  etatChaineDeLaCopie, resumerLaFile, demandentUnGeste, ETAPE_MESURE_V1,
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
