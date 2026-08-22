// ============================================================================
// C4 · L8-bis — LA LECTURE DE LA DOCTRINE, prouvée SANS BASE.
// ----------------------------------------------------------------------------
// Pourquoi ce fichier existe, et pourquoi il ne ressemble à aucun autre du
// dossier : LE DÉFAUT A VÉCU SOUS 414 TESTS VERTS. `divergences.test.ts` et
// `verifie-import.test.ts` assemblent depuis `doctrine.fixture.json`, qui porte
// les 3264 routes — ils n'ont JAMAIS vu PostgREST, et ne pouvaient donc pas voir
// qu'une réponse plafonnée à mille lignes rendait sept objets sur treize
// inconcevables.
//
// La boucle et son garde-fou se prouvent donc sur une DOUBLURE DE CLIENT : un
// faux `admin` qui rend des pages de mille lignes et un décompte, et qui joue
// les trois cas —
//   · la pagination COMPLÈTE, sur une table qui déborde ;
//   · le décompte qui CONCORDE, et la lecture passe ;
//   · le décompte qui DIFFÈRE, et la lecture s'arrête.
//
// ⚠️ AUCUNE BASE, AUCUNE RACINE. Ce fichier ne joint pas la sandbox et ne lit
// aucun chemin absolu : il passe partout, y compris là où la base est
// injoignable — ce que la preuve à l'écran, elle, ne peut pas offrir.
// ============================================================================

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  chargerLignesDepuisBase, chargerDoctrineDepuisBase,
  DoctrineAbsente, DoctrineTronquee, banqueDeConsignes,
} from './doctrine'

// ── La doublure ─────────────────────────────────────────────────────────────

/** Les douze tables que la lecture demande, dans l'ordre où elle les appelle. */
const TABLES = [
  'exercices_types', 'exercices_types_modes', 'exercices_types_modes_source',
  'exercices_types_crans', 'exercices_crans', 'exercices_durees',
  'competences_modes_admis', 'exercices_routes', 'exercices_consignes_isolees',
  'exercices_consignes_production', 'exercices_guides_production',
  'demonstrations_formes',
] as const

interface Appel { table: string; tri: string[]; de: number; a: number }

/**
 * Un faux `admin` qui se comporte comme PostgREST : il PLAFONNE toute réponse à
 * `PAGE` lignes SANS RIEN SIGNALER — `error` reste nul —, et il sait dire, à
 * part, le décompte de la table. C'est exactement le couple qui a fabriqué le
 * défaut du 21/08.
 *
 * `comptes` permet de faire MENTIR le décompte : c'est ainsi qu'on éprouve le
 * garde-fou sans avoir à casser la pagination.
 */
function doublure(
  contenu: Record<string, unknown[]>,
  options: { page?: number; comptes?: Record<string, number | null>; journal?: Appel[] } = {},
) {
  const PAGE = options.page ?? 1000
  return {
    from(table: string) {
      const lignes = contenu[table] ?? []
      const select = (_cols: string, opts?: { count: 'exact'; head: true }) => {
        if (opts?.head) {
          const c = options.comptes && table in options.comptes
            ? options.comptes[table] : lignes.length
          return Promise.resolve({ count: c, error: null })
        }
        const tri: string[] = []
        const requete = {
          order(colonne: string) { tri.push(colonne); return requete },
          range(de: number, a: number) {
            options.journal?.push({ table, tri: [...tri], de, a })
            // ⚠️ Le plafond de PostgREST, reproduit : la tranche demandée est
            //    rognée à PAGE lignes, et `error` reste NUL.
            const tranche = lignes.slice(de, a + 1).slice(0, PAGE)
            return Promise.resolve({ data: tranche, error: null })
          },
        }
        return requete
      }
      return { select } as never
    },
  }
}

// ── Un jeu de lignes minimal, mais COMPLET ──────────────────────────────────
//
// Aucune valeur de doctrine n'est vraie ici : ce fichier éprouve la LECTURE,
// pas la doctrine. Les seules exigences sont celles de `assemblerDoctrine` —
// des crans, des types et des routes non vides.

const route = (i: number, objet = 'partie') => ({
  objet_code: objet, mode: 'composer', cran: 3, competence: 'expression',
  observable_code: `obs_${i}`, observable_nom: `observable ${i}`,
  source_fichier: 'instances/04-expression.md', source_section: i,
})

const consigne = (i: number) => ({
  competence: 'expression', source_section: i, cran: 3,
  observable_nom: `observable ${i}`, observable_code_composition: `obs_${i}`,
  observable_code_reception: `obs_${i}`, defaut_injecte: 'un défaut',
  appui: 'un appui', consigne: `consigne ${i}`,
})

const lignesDe = (nRoutes: number): Record<string, unknown[]> => ({
  exercices_types: [{
    code: 'partie', nature: 'element', grain: 'macro', libelle: 'La partie',
    supports_source: ['texte'], genres_admis: null, competences: ['expression'],
    crans_admis: ['1', '3'], exclusions_parcours: [],
  }],
  exercices_types_modes: [{ competence: 'expression', modes: ['composer'], exercices_types: { code: 'partie' } }],
  exercices_types_modes_source: [{
    mode: 'composer', provenances_admises: ['genere'], supports_admis: ['texte'],
    exercices_types: { code: 'partie' },
  }],
  exercices_types_crans: [{
    cran: '3', couverture_observables: 'isole', provenances_admises_cible: ['genere'],
    duree_exercice_min: 45, exercices_types: { code: 'partie' },
  }],
  exercices_crans: [{
    cran: 3, code: 'transformation_guidee', geste: 'transformer', appui: 'candidats',
    fait: 'corrige', palier_vise: 'p1', materiau_cible: 'présent', defaut: 'présent',
    distracteurs: 'présent', reponse_attendue: 'présent', guide: 'null',
    jugement: 'algorithmique', couverture_observables: 'isole', regime_v1vf: 'plein',
  }],
  exercices_durees: [{ geste: 'transformer', grain: 'macro', borne_min: 30, borne_max: 60, duree_min: 45 }],
  competences_modes_admis: [{ competence: 'expression', mode: 'composer' }],
  exercices_routes: Array.from({ length: nRoutes }, (_, i) => route(i)),
  // 336 en base : la deuxième table la plus fournie, et elle tient en une page.
  // C'est la disproportion réelle — une seule table déborde aujourd'hui.
  exercices_consignes_isolees: Array.from({ length: Math.min(nRoutes, 336) }, (_, i) => consigne(i)),
  exercices_consignes_production: [{ mode: 'composer', cran: 2, patron: 'Écris <objet>.' }],
  exercices_guides_production: [{
    objet_code: 'partie', genre: null, figure: 'plan',
    guide_cran2: 'le plan de la partie', guide_cran6: null,
  }],
  demonstrations_formes: [{ forme: 'exemple', grain: 'micro' }],
})

// ── Cas 1 · LA PAGINATION COMPLÈTE ──────────────────────────────────────────

test('la lecture rend les 3264 routes, là où une réponse non paginée en rendait mille', async () => {
  const journal: Appel[] = []
  const lignes = await chargerLignesDepuisBase(doublure(lignesDe(3264), { journal }) as never)

  assert.equal(lignes.exercices_routes.length, 3264)

  // Quatre tours sur la table qui déborde — 1000 · 1000 · 1000 · 264 —, et la
  // boucle ne s'arrête QUE sur une page courte.
  const tours = journal.filter((a) => a.table === 'exercices_routes')
  assert.equal(tours.length, 4)
  assert.deepEqual(tours.map((a) => [a.de, a.a]),
    [[0, 999], [1000, 1999], [2000, 2999], [3000, 3999]])
})

test('la pagination NE SAUTE ET NE RÉPÈTE aucune ligne — le contenu, pas le nombre', async () => {
  const lignes = await chargerLignesDepuisBase(doublure(lignesDe(3264)) as never)
  const vues = lignes.exercices_routes.map((r) => r.source_section)
  assert.equal(new Set(vues).size, 3264, 'des lignes se répètent ou se perdent')
  assert.deepEqual(vues, [...Array(3264).keys()])
})

test('les ONZE autres tables tiennent en une page — le coût de la boucle y est nul', async () => {
  const journal: Appel[] = []
  await chargerLignesDepuisBase(doublure(lignesDe(3264), { journal }) as never)
  for (const t of TABLES) {
    if (t === 'exercices_routes') continue
    assert.equal(journal.filter((a) => a.table === t).length, 1,
      `${t} : la première page revient courte, la boucle doit s'arrêter au premier tour`)
  }
})

test('LES DOUZE TABLES passent par le même chemin, et TOUTES sont ordonnées', async () => {
  const journal: Appel[] = []
  await chargerLignesDepuisBase(doublure(lignesDe(3264), { journal }) as never)
  assert.deepEqual([...new Set(journal.map((a) => a.table))].sort(), [...TABLES].sort())
  // ⭐ Sans tri stable, deux pages peuvent se recouvrir ET une ligne se perdre :
  //    une doctrine du bon NOMBRE et du mauvais CONTENU. Aucune table n'en sort.
  for (const a of journal) {
    assert.ok(a.tri.length > 0, `${a.table} est lue SANS ORDRE — la pagination y est fausse`)
  }
})

test('la table qui déborde est ordonnée sur sa CLÉ PRIMAIRE, page après page', async () => {
  const journal: Appel[] = []
  await chargerLignesDepuisBase(doublure(lignesDe(3264), { journal }) as never)
  for (const a of journal.filter((x) => x.table === 'exercices_routes')) {
    assert.deepEqual(a.tri, ['id'])
  }
  // Les tables à clé composite portent la clé ENTIÈRE : une clé partielle
  // laisse des ex æquo, et un ex æquo suffit à faire glisser une page.
  const cles: Record<string, string[]> = {
    exercices_consignes_isolees: ['competence', 'source_section', 'cran'],
    exercices_types_modes_source: ['type_id', 'mode'],
    competences_modes_admis: ['competence', 'mode'],
    exercices_durees: ['geste', 'grain'],
    exercices_consignes_production: ['mode', 'cran'],
    exercices_guides_production: ['type_id', 'genre'],
    exercices_crans: ['cran'],
    demonstrations_formes: ['forme'],
  }
  for (const [table, cle] of Object.entries(cles)) {
    assert.deepEqual(journal.find((a) => a.table === table)?.tri, cle, table)
  }
})

test('la banque de la partie au cran 3 : ZÉRO sans la boucle, QUARANTE avec', async () => {
  // Le chiffre qui fait la preuve, rejoué hors ligne. Les quarante routes de
  // `partie` × `composer` au cran 3 sont placées APRÈS la millième ligne : sans
  // la boucle, elles ne reviennent jamais, la banque s'affiche vide, et le
  // choix étant obligatoire, L'OBJET DEVIENT INCONCEVABLE.
  const contenu = {
    ...lignesDe(0),
    exercices_routes: [
      ...Array.from({ length: 1000 }, (_, i) => route(i, 'argument')),
      ...Array.from({ length: 40 }, (_, i) => route(1000 + i)),
    ],
    exercices_consignes_isolees: Array.from({ length: 40 }, (_, i) => consigne(1000 + i)),
  }

  const d = await chargerDoctrineDepuisBase(doublure(contenu) as never)
  assert.equal(banqueDeConsignes(d, 'partie', 'composer', 3).length, 40)

  // Et la contre-épreuve : la même doctrine, lue SANS boucle — c'est l'écran du
  // 21/08. On la fabrique en faisant mentir le décompte de concert, sans quoi le
  // garde-fou lèverait avant qu'on puisse regarder.
  const tronquee = { ...contenu, exercices_routes: contenu.exercices_routes.slice(0, 1000) }
  const avant = await chargerDoctrineDepuisBase(doublure(tronquee) as never)
  assert.equal(banqueDeConsignes(avant, 'partie', 'composer', 3).length, 0)
})

// ── Cas 2 · LE DÉCOMPTE QUI CONCORDE ────────────────────────────────────────

test('le décompte concorde, table par table : la lecture passe et rend la doctrine', async () => {
  const d = await chargerDoctrineDepuisBase(doublure(lignesDe(3264)) as never)
  assert.ok(d.objets.partie, 'la doctrine est assemblée')
  assert.equal(d.routes['partie|composer'].length, 3264)
})

test('le décompte se demande à la BASE, jamais aux comptes de la fixture', async () => {
  // ⚠️ `exercices_types` porte QUINZE lignes en base — les treize objets dérivés
  //    PLUS les deux types diagnostiques du seed de C4-L1 — quand la fixture n'en
  //    porte que treize. Un garde-fou écrit sur la fixture crierait faux à chaque
  //    chargement, et on l'enlèverait dans la semaine.
  const contenu = lignesDe(10)
  contenu.exercices_types = [
    ...contenu.exercices_types,
    { code: 'diagnostic_essai', nature: 'complet', grain: null, libelle: null,
      supports_source: [], genres_admis: null, competences: [], crans_admis: [],
      exclusions_parcours: [] },
    { code: 'diagnostic_explication_texte', nature: 'complet', grain: null, libelle: null,
      supports_source: [], genres_admis: null, competences: [], crans_admis: [],
      exclusions_parcours: [] },
  ]
  const d = await chargerDoctrineDepuisBase(doublure(contenu) as never)
  // Les deux types diagnostiques sont LUS — le décompte les compte — puis écartés
  // à l'assemblage : ils n'ont ni objet ni cran.
  assert.deepEqual(Object.keys(d.objets), ['partie'])
})

// ── Cas 3 · LE DÉCOMPTE QUI DIFFÈRE, ET QUI ARRÊTE ──────────────────────────

test('le décompte diffère : la lecture S\'ARRÊTE, elle ne se contente pas d\'avertir', async () => {
  // La base annonce 3264 routes, la lecture n'en rend que mille : c'est
  // exactement le défaut du 21/08, et il doit désormais lever.
  const contenu = lignesDe(1000)
  await assert.rejects(
    () => chargerDoctrineDepuisBase(doublure(contenu, { comptes: { exercices_routes: 3264 } }) as never),
    (e: unknown) => {
      assert.ok(e instanceof DoctrineTronquee)
      // Rien ne l'attrape dans les quatre chemins : elle reste une
      // `DoctrineAbsente`, et son message remonte tel quel à l'écran.
      assert.ok(e instanceof DoctrineAbsente)
      return true
    })
})

test('le refus NOMME la table, le nombre LU et le nombre ATTENDU', async () => {
  // « Écris-le pour quelqu'un qui découvre le problème un mardi matin. »
  const contenu = lignesDe(1000)
  await assert.rejects(
    () => chargerLignesDepuisBase(doublure(contenu, { comptes: { exercices_routes: 3264 } }) as never),
    (e: Error) => {
      assert.match(e.message, /exercices_routes/)
      assert.match(e.message, /1000 ligne\(s\) lue\(s\)/)
      assert.match(e.message, /3264 en base/)
      assert.match(e.message, /TRONQUÉE/)
      return true
    })
})

test('la troncature d\'une PETITE table arrête aussi — les douze sont gardées', async () => {
  // Un correctif qui ne garderait que `exercices_routes` laisserait le même
  // défaut revenir en silence le jour où une autre source grossit.
  for (const table of TABLES) {
    const contenu = lignesDe(12)
    await assert.rejects(
      () => chargerLignesDepuisBase(
        doublure(contenu, { comptes: { [table]: (contenu[table]?.length ?? 0) + 1 } }) as never),
      (e: Error) => {
        assert.ok(e instanceof DoctrineTronquee, table)
        assert.match(e.message, new RegExp(table))
        return true
      })
  }
})

test('un décompte INDISPONIBLE arrête aussi — on ne devine pas un nombre manquant', async () => {
  await assert.rejects(
    () => chargerLignesDepuisBase(
      doublure(lignesDe(12), { comptes: { exercices_routes: null } }) as never),
    (e: Error) => {
      assert.ok(e instanceof DoctrineTronquee)
      assert.match(e.message, /décompte indisponible/)
      return true
    })
})

test('une doctrine VIDE reste refusée — le garde-fou d\'avant n\'a pas été remplacé', async () => {
  const contenu = lignesDe(0)
  await assert.rejects(
    () => chargerDoctrineDepuisBase(doublure(contenu) as never),
    (e: Error) => {
      assert.ok(e instanceof DoctrineAbsente)
      assert.ok(!(e instanceof DoctrineTronquee), 'vide et tronquée ne se confondent pas')
      assert.match(e.message, /accepterait tout/)
      return true
    })
})

test('une erreur de lecture reste une erreur de lecture, et nomme sa table', async () => {
  const casse = {
    from: () => ({
      select: (_cols: string, opts?: { head: true }) => opts?.head
        ? Promise.resolve({ count: 0, error: null })
        : {
          order() { return this },
          range: () => Promise.resolve({ data: null, error: { code: '42P01', message: 'relation absente' } }),
        },
    }),
  }
  await assert.rejects(
    () => chargerLignesDepuisBase(casse as never),
    (e: Error) => {
      assert.ok(e instanceof DoctrineAbsente)
      assert.match(e.message, /lecture de exercices_/)
      return true
    })
})
