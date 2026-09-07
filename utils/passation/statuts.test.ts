// ============================================================================
// C10 · L2 — CE QUE LA GARDE DE CLÔTURE DOIT TENIR.
// ----------------------------------------------------------------------------
// ⚠️ `tsc` ET `npm test` NE DISAIENT RIEN DE CE LOT avant ce fichier :
//    `utils/passation/` n'avait aucun test de `depots.ts` (il ouvre par
//    `import 'server-only'`, qu'un test ne peut pas résoudre), et
//    `grep "Ce dépôt est clos" --include='*.test.ts'` rendait 0.
// ============================================================================

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { depotClos, STATUTS_DU_DEPOT, MESSAGE_DEPOT_CLOS } from './statuts'

const CLOS = ['retire', 'abandonne', 'clos']

test('la garde refuse les trois statuts fermés, et ceux-là seulement', () => {
  for (const statut of CLOS) {
    assert.equal(depotClos({ statut }), true, `« ${statut} » devrait fermer le dépôt`)
  }
})

test('elle laisse passer les six autres — l’élève garde ses gestes', () => {
  const passants = STATUTS_DU_DEPOT.filter((s) => !CLOS.includes(s))
  // ⭐ Le compte est ASSERTÉ, pas supposé : un dixième statut ajouté en base sans
  //    passer par `STATUTS_DU_DEPOT` fera tomber cette ligne, et non la garde.
  assert.equal(passants.length, 6, `six statuts passants attendus, ${passants.length} trouvés`)
  for (const statut of passants) {
    assert.equal(depotClos({ statut }), false, `« ${statut} » ne devrait rien fermer`)
  }
})

test('`non_fait` passe — c’est une désignation du professeur sur le déroulé de la MAISON', () => {
  // Ne pas le confondre avec `abandonne` : `c6_designation_non_fait.sql:11-14` a
  // créé un statut NEUF plutôt que de réemployer celui-ci, précisément pour que
  // les écrans ne mentent pas. La garde d'écriture de la CLASSE n'a rien à y voir.
  assert.equal(depotClos({ statut: 'non_fait' }), false)
})

test('`vf_remis` passe — en classe il n’existe pas, et ailleurs il n’est pas clos', () => {
  assert.equal(depotClos({ statut: 'vf_remis' }), false)
})

test('la liste des statuts est celle du CHECK en base — neuf valeurs', () => {
  // Mesuré le 07/09/2026, bac à sable :
  // exercices_depots_statut_check CHECK (statut = ANY (ARRAY[
  //   'assigne','ouvert','v1_remis','retour_publie','vf_remis',
  //   'clos','abandonne','retire','non_fait']))
  assert.equal(STATUTS_DU_DEPOT.length, 9)
  assert.deepEqual([...STATUTS_DU_DEPOT], [
    'assigne', 'ouvert', 'v1_remis', 'retour_publie', 'vf_remis',
    'clos', 'abandonne', 'retire', 'non_fait',
  ])
})

test('le message est celui qui existait déjà, mot pour mot', () => {
  // `utils/passation/depots.ts:243` avant ce lot. ⛔ Surtout pas
  // `MESSAGE_SEMAINE_FERMEE` : sur une passation close à la main, il mentirait
  // deux fois — la raison du refus n'est pas la semaine, et aucun nouvel
  // exercice de classe n'attend l'élève.
  assert.equal(MESSAGE_DEPOT_CLOS, 'Ce dépôt est clos.')
})
